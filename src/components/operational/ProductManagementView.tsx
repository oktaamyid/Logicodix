"use client";

import { useState, useTransition } from "react";
import { formatIDR, cn } from "@/lib/utils";
import {
  upsertProductAction,
  deleteProductAction,
  adjustStockAction,
  createCategoryAction,
} from "@/app/dashboard/operational/actions";
import {
  Plus,
  Search,
  Package,
  Layers,
  AlertTriangle,
  TrendingUp,
  Edit2,
  Trash2,
  RefreshCw,
  FolderPlus,
  CheckCircle2,
  X,
  ExternalLink,
  Percent,
  Cpu,
} from "lucide-react";

const DEFAULT_UNITS = [
  "pcs",
  "box",
  "pack",
  "cup",
  "porsi",
  "botol",
  "bks",
  "kg",
  "gram",
  "liter",
  "pasang",
  "lusin",
];
import {
  recommendPricingML,
  generateProductDescriptionNLG,
} from "@/lib/ai/ml-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ProductItem {
  id: string;
  storeId: string;
  categoryId: string | null;
  categoryName: string | null;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
  isPublished: boolean;
  isActive: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductManagementViewProps {
  initialProducts: ProductItem[];
  categories: CategoryItem[];
  storeId: string;
  storeSlug: string;
}

export function ProductManagementView({
  initialProducts,
  categories: initialCategories,
  storeId,
  storeSlug,
}: ProductManagementViewProps) {
  const [productsList, setProductsList] = useState<ProductItem[]>(initialProducts);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState<ProductItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form Fields for Add/Edit Product
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    categoryId: "",
    description: "",
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    unit: "pcs",
    isPublished: true,
  });

  // Stock Adjustment Form
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "restock" as "restock" | "adjustment" | "damaged",
    quantityChange: 10,
    notes: "Restock pasokan baru",
  });

  // New Category Field
  const [newCategoryName, setNewCategoryName] = useState("");

  // Custom Unit State
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [isAddingCustomUnit, setIsAddingCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState("");

  const unitOptions = Array.from(
    new Set([
      ...DEFAULT_UNITS,
      ...productsList.map((p) => p.unit).filter(Boolean),
      ...customUnits,
      ...(formData.unit ? [formData.unit] : []),
    ])
  );

  const handleSaveCustomUnit = () => {
    const trimmed = customUnitInput.trim().toLowerCase();
    if (trimmed) {
      if (!customUnits.includes(trimmed)) {
        setCustomUnits((prev) => [...prev, trimmed]);
      }
      setFormData((prev) => ({ ...prev, unit: trimmed }));
    }
    setIsAddingCustomUnit(false);
    setCustomUnitInput("");
  };

  // Filtered Products
  const filteredProducts = productsList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;
    } else if (stockFilter === "out") {
      matchesStock = item.stockQuantity === 0;
    } else if (stockFilter === "safe") {
      matchesStock = item.stockQuantity > item.lowStockThreshold;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // KPI Calculations
  const totalProducts = productsList.length;
  const totalStockAssets = productsList.reduce(
    (sum, p) => sum + p.stockQuantity * p.costPrice,
    0
  );
  const lowStockCount = productsList.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  ).length;

  const averageMargin =
    totalProducts > 0
      ? (
          productsList.reduce((sum, p) => {
            const margin =
              p.sellingPrice > 0
                ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100
                : 0;
            return sum + margin;
          }, 0) / totalProducts
        ).toFixed(1)
      : "0";

  // Form handlers
  const handleOpenAddForm = () => {
    setIsAddingCustomUnit(false);
    setCustomUnitInput("");
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      name: "",
      categoryId: categoryList[0]?.id || "",
      description: "",
      costPrice: 10000,
      sellingPrice: 15000,
      stockQuantity: 20,
      lowStockThreshold: 5,
      unit: "pcs",
      isPublished: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: ProductItem) => {
    setIsAddingCustomUnit(false);
    setCustomUnitInput("");
    setEditingProduct(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      categoryId: item.categoryId || "",
      description: item.description || "",
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold,
      unit: item.unit,
      isPublished: item.isPublished,
    });
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await upsertProductAction({
        id: editingProduct?.id,
        storeId,
        categoryId: formData.categoryId || null,
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        unit: formData.unit,
        isPublished: formData.isPublished,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      const categoryObj = categoryList.find((c) => c.id === formData.categoryId);
      const updatedItem: ProductItem = {
        ...res.data,
        categoryName: categoryObj ? categoryObj.name : null,
      };

      if (editingProduct) {
        setProductsList((prev) =>
          prev.map((p) => (p.id === updatedItem.id ? updatedItem : p))
        );
        setFeedback({ type: "success", message: `Produk "${updatedItem.name}" berhasil diperbarui.` });
      } else {
        setProductsList((prev) => [updatedItem, ...prev]);
        setFeedback({ type: "success", message: `Produk "${updatedItem.name}" berhasil ditambahkan ke katalog.` });
      }

      setIsFormOpen(false);
    });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!confirm(`Hapus atau nonaktifkan produk "${productName}" dari katalog?`)) return;

    startTransition(async () => {
      const res = await deleteProductAction(productId, storeId);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }
      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      setFeedback({ type: "success", message: `Produk "${productName}" berhasil dihapus.` });
    });
  };

  const handleOpenStockModal = (item: ProductItem) => {
    setStockTargetProduct(item);
    setStockAdjustment({
      type: "restock",
      quantityChange: 10,
      notes: "Restock stok masuk dari supplier",
    });
    setIsStockModalOpen(true);
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTargetProduct) return;

    startTransition(async () => {
      const isNegative = stockAdjustment.type === "damaged";
      const qtyChange = isNegative
        ? -Math.abs(stockAdjustment.quantityChange)
        : Math.abs(stockAdjustment.quantityChange);

      const res = await adjustStockAction({
        storeId,
        productId: stockTargetProduct.id,
        type: stockAdjustment.type,
        quantityChange: qtyChange,
        notes: stockAdjustment.notes,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setProductsList((prev) =>
        prev.map((p) =>
          p.id === stockTargetProduct.id
            ? { ...p, stockQuantity: res.data.currentStock }
            : p
        )
      );

      setFeedback({
        type: "success",
        message: `Stok "${stockTargetProduct.name}" berhasil disesuaikan menjadi ${res.data.currentStock} ${stockTargetProduct.unit}.`,
      });
      setIsStockModalOpen(false);
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const res = await createCategoryAction({
        storeId,
        name: newCategoryName.trim(),
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setCategoryList((prev) => [...prev, res.data]);
      setFormData((prev) => ({ ...prev, categoryId: res.data.id }));
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
      setFeedback({ type: "success", message: `Kategori "${res.data.name}" berhasil dibuat.` });
    });
  };

  // Live Margin Calculation inside Modal
  const currentCost = Number(formData.costPrice) || 0;
  const currentSelling = Number(formData.sellingPrice) || 0;
  const profitNominal = Math.max(0, currentSelling - currentCost);
  const profitMarginPercent =
    currentSelling > 0 ? ((profitNominal / currentSelling) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-lg border text-sm flex items-center justify-between transition-all",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Produk Aktif
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">{totalProducts}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nilai Aset Stok (HPP)
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {formatIDR(totalStockAssets)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Peringatan Stok Menipis
            </p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {lowStockCount} <span className="text-xs font-normal text-muted-foreground">item</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rata-rata Margin Laba
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {averageMargin}%
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama produk atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-md border text-sm bg-background text-foreground"
          >
            <option value="all">Semua Kategori ({categoryList.length})</option>
            {categoryList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-9 px-3 rounded-md border text-sm bg-background text-foreground"
          >
            <option value="all">Semua Status Stok</option>
            <option value="safe">Stok Aman</option>
            <option value="low">Mendekati Minimum</option>
            <option value="out">Stok Habis</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-9 gap-1.5"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden md:inline">Kategori Baru</span>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddForm}
            className="h-9 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk</span>
          </Button>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Produk & SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Modal (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Margin</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-center">Status Publik</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Tidak ada produk yang cocok dengan pencarian.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klik "Tambah Produk" untuk mendaftarkan barang baru ke toko Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const marginPct =
                    p.sellingPrice > 0
                      ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1)
                      : "0";
                  const isLow = p.stockQuantity <= p.lowStockThreshold;
                  const isOut = p.stockQuantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {p.categoryName || "Tanpa Kategori"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {formatIDR(p.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                        {formatIDR(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5",
                            Number(marginPct) >= 30
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : Number(marginPct) >= 15
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          )}
                        >
                          <Percent className="h-3 w-3" />
                          {marginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={cn(
                              "font-bold font-mono text-sm",
                              isOut
                                ? "text-red-600 dark:text-red-400"
                                : isLow
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            )}
                          >
                            {p.stockQuantity}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {p.unit}
                            </span>
                          </span>
                          {isOut ? (
                            <span className="text-[10px] text-red-600 font-semibold uppercase">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] text-amber-600 font-semibold uppercase">
                              Menipis (&le;{p.lowStockThreshold})
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.isPublished ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Tampil
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Disembunyikan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStockModal(p)}
                            title="Mutasi Stok / Restock Cepat"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditForm(p)}
                            title="Edit Produk & Harga"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Hapus Produk"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Produk */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg text-foreground">
                {editingProduct ? "Edit Produk & HPP" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Kode SKU <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 font-mono text-sm"
                    placeholder="Contoh: KOP-001"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Kategori Produk
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-md border text-sm bg-background text-foreground"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 text-sm"
                  placeholder="Contoh: Kopi Arabika Gayo Single Origin 250g"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Deskripsi Singkat
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const matchedCat = categoryList.find(
                        (c) => c.id === formData.categoryId
                      );
                      const generated = generateProductDescriptionNLG({
                        name: formData.name,
                        categoryName: matchedCat?.name,
                        unit: formData.unit,
                      });
                      setFormData({ ...formData, description: generated });
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-primary hover:bg-emerald-50 transition-colors"
                  >
                    <Cpu className="h-3 w-3" />
                    <span>Susun Deskripsi Otomatis</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full p-2.5 rounded-md border text-sm bg-background text-foreground resize-none"
                  placeholder="Catatan rasa, bahan baku, atau spesifikasi kerajinan..."
                />
              </div>

              {/* Kalkulator Finansial & HPP */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Struktur Harga & Margin</span>
                  <span className="text-emerald-700 font-mono">
                    Margin: {profitMarginPercent}% ({formatIDR(profitNominal)})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Harga Modal / Kulakan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      required
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Harga Jual ke Pembeli (Rp) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={100}
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Rekomendasi Harga Jual Optimal Berbasis Distribusi Margin Toko */}
                {formData.costPrice > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Cpu className="h-3.5 w-3.5 text-primary" />
                      <span>Saran Harga Jual Otomatis (Klik untuk langsung pakai):</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {recommendPricingML(
                        formData.costPrice,
                        productsList
                          .filter((p) => p.sellingPrice > 0)
                          .map((p) => (p.sellingPrice - p.costPrice) / p.sellingPrice)
                      ).map((rec) => (
                        <button
                          key={rec.tier}
                          type="button"
                          title={rec.rationale}
                          onClick={() =>
                            setFormData({ ...formData, sellingPrice: rec.sellingPrice })
                          }
                          className={`rounded-lg border p-2 text-left transition-colors ${
                            formData.sellingPrice === rec.sellingPrice
                              ? "border-primary bg-emerald-50 text-emerald-950"
                              : "border-border bg-background hover:bg-secondary/60"
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                            {rec.tier}
                          </div>
                          <div className="font-mono text-xs font-bold text-foreground mt-0.5">
                            {formatIDR(rec.sellingPrice)}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-700">
                            Margin {rec.marginPercent}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inventori & Batas Minimum */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Jumlah Stok <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Batas Minimum Stok
                  </label>
                  <Input
                    type="number"
                    min={0}
                    required
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Satuan Barang
                    </label>
                    {!isAddingCustomUnit && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomUnit(true)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        + Opsi Baru
                      </button>
                    )}
                  </div>

                  {isAddingCustomUnit ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        autoFocus
                        placeholder="Contoh: toples, jar"
                        value={customUnitInput}
                        onChange={(e) => setCustomUnitInput(e.target.value)}
                        className="text-xs h-9 font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveCustomUnit();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-3 text-xs bg-primary text-primary-foreground font-semibold"
                        onClick={handleSaveCustomUnit}
                      >
                        Pakai
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-2 text-xs"
                        onClick={() => {
                          setIsAddingCustomUnit(false);
                          setCustomUnitInput("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={formData.unit}
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setIsAddingCustomUnit(true);
                        } else {
                          setFormData({ ...formData, unit: e.target.value });
                        }
                      }}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u} className="bg-background text-foreground">
                          {u}
                        </option>
                      ))}
                      <option value="__add_new__" className="font-semibold text-primary">
                        + Tambah Opsi Satuan Baru...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
                  Tampilkan produk di Storefront Publik ({storeSlug})
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {isPending ? "Menyimpan..." : editingProduct ? "Perbarui Produk" : "Simpan Produk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Restock / Penyesuaian Mutasi */}
      {isStockModalOpen && stockTargetProduct && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-foreground">Mutasi Stok Cepat</h3>
                <p className="text-xs text-muted-foreground">{stockTargetProduct.name}</p>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-sm flex justify-between items-center">
                <span className="text-muted-foreground">Stok Fisik Saat Ini:</span>
                <span className="font-mono font-bold text-foreground">
                  {stockTargetProduct.stockQuantity} {stockTargetProduct.unit}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Jenis Mutasi</label>
                <select
                  value={stockAdjustment.type}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      type: e.target.value as "restock" | "adjustment" | "damaged",
                    })
                  }
                  className="mt-1 w-full h-10 px-3 rounded-md border text-sm bg-background text-foreground"
                >
                  <option value="restock">Restock (Barang Masuk)</option>
                  <option value="adjustment">Penyesuaian Opname Fisik</option>
                  <option value="damaged">Barang Rusak / Kadaluarsa (Pengurangan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Jumlah ({stockTargetProduct.unit})
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={stockAdjustment.quantityChange}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      quantityChange: Number(e.target.value),
                    })
                  }
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Keterangan / Catatan Audit
                </label>
                <Input
                  required
                  value={stockAdjustment.notes}
                  onChange={(e) =>
                    setStockAdjustment({ ...stockAdjustment, notes: e.target.value })
                  }
                  className="mt-1 text-sm"
                  placeholder="Misal: Faktur suplier #921 atau hasil opname mingguan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStockModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {isPending ? "Memproses..." : "Simpan Mutasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori Baru */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-foreground">Kategori Produk Baru</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Kopi Spesialti, Camilan Tradisional"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {isPending ? "Menyimpan..." : "Buat Kategori"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
