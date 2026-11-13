"use client";

import { useState, useTransition } from "react";
import { formatDateTime, cn } from "@/lib/utils";
import { adjustStockAction } from "@/app/dashboard/operational/actions";
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StockMovementItem {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productSku: string;
  type: "initial" | "restock" | "sale_pos" | "sale_online" | "adjustment" | "damaged";
  quantityChange: number;
  previousStock: number;
  currentStock: number;
  referenceOrderId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date | string;
}

export interface ProductSimple {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  unit: string;
}

interface InventoryAuditViewProps {
  initialMovements: StockMovementItem[];
  products: ProductSimple[];
  storeId: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  initial: {
    label: "Stok Awal",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    icon: Package,
  },
  restock: {
    label: "Restock Masuk",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    icon: ArrowDownLeft,
  },
  sale_pos: {
    label: "Penjualan POS",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    icon: ArrowUpRight,
  },
  sale_online: {
    label: "Penjualan Online",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    icon: ArrowUpRight,
  },
  adjustment: {
    label: "Opname Fisik",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    icon: RefreshCw,
  },
  damaged: {
    label: "Barang Rusak",
    color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    icon: AlertTriangle,
  },
};

export function InventoryAuditView({
  initialMovements,
  products,
  storeId,
}: InventoryAuditViewProps) {
  const [movements, setMovements] = useState<StockMovementItem[]>(initialMovements);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form Opname
  const [formProduct, setFormProduct] = useState(products[0]?.id || "");
  const [formType, setFormType] = useState<"restock" | "adjustment" | "damaged">("restock");
  const [formQty, setFormQty] = useState<number>(10);
  const [formNotes, setFormNotes] = useState("Pasokan bahan baku masuk");

  // Metrics
  const totalMovements = movements.length;
  const restockSum = movements
    .filter((m) => m.type === "restock" || m.type === "initial")
    .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);
  const salesSum = movements
    .filter((m) => m.type === "sale_pos" || m.type === "sale_online")
    .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);
  const wasteSum = movements
    .filter((m) => m.type === "damaged")
    .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);

  // Filtered
  const filtered = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "all" || m.type === selectedType;
    const matchesProduct = selectedProduct === "all" || m.productId === selectedProduct;

    return matchesSearch && matchesType && matchesProduct;
  });

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct) return;

    startTransition(async () => {
      const selectedProd = products.find((p) => p.id === formProduct);
      const isNegative = formType === "damaged";
      const qtyChange = isNegative ? -Math.abs(formQty) : Math.abs(formQty);

      const res = await adjustStockAction({
        storeId,
        productId: formProduct,
        type: formType,
        quantityChange: qtyChange,
        notes: formNotes,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      const newMovement: StockMovementItem = {
        ...res.data,
        productName: selectedProd?.name || "Produk",
        productSku: selectedProd?.sku || "SKU",
      };

      setMovements((prev) => [newMovement, ...prev]);
      setFeedback({
        type: "success",
        message: `Mutasi stok untuk "${newMovement.productName}" berhasil dicatat.`,
      });
      setIsModalOpen(false);
    });
  };

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
              Total Log Mutasi
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">{totalMovements}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Barang Masuk
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">+{restockSum}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Barang Terjual
            </p>
            <p className="text-2xl font-bold mt-1 text-purple-600">-{salesSum}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Barang Rusak / Afkir
            </p>
            <p className="text-2xl font-bold mt-1 text-red-600">-{wasteSum}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk, SKU, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-md border text-sm bg-background text-foreground"
          >
            <option value="all">Semua Jenis Mutasi</option>
            <option value="restock">Restock Masuk</option>
            <option value="sale_pos">Penjualan Kasir POS</option>
            <option value="sale_online">Penjualan Online</option>
            <option value="adjustment">Opname Fisik</option>
            <option value="damaged">Barang Rusak</option>
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="h-9 px-3 rounded-md border text-sm bg-background text-foreground"
          >
            <option value="all">Semua Produk ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Catat Opname / Restock</span>
        </Button>
      </div>

      {/* Movement Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Jenis Mutasi</th>
                <th className="py-3 px-4 text-center">Stok Awal</th>
                <th className="py-3 px-4 text-center">Perubahan</th>
                <th className="py-3 px-4 text-center">Stok Akhir</th>
                <th className="py-3 px-4">Catatan / Referensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Belum ada riwayat mutasi stok yang tercatat.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const cfg = TYPE_CONFIG[m.type] || {
                    label: m.type,
                    color: "bg-muted text-muted-foreground",
                    icon: Layers,
                  };
                  const Icon = cfg.icon;
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{m.productName}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {m.productSku}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            cfg.color
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {m.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "font-bold font-mono text-sm",
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-foreground">
                        {m.currentStock}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {m.notes || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Opname */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-foreground">Catat Mutasi / Opname Stok</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpname} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Pilih Produk</label>
                <select
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border text-sm bg-background text-foreground"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Jenis Penyesuaian</label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as "restock" | "adjustment" | "damaged")
                  }
                  className="mt-1 w-full h-10 px-3 rounded-md border text-sm bg-background text-foreground"
                >
                  <option value="restock">Restock (Barang Masuk / Tambahan)</option>
                  <option value="adjustment">Penyesuaian Opname Fisik</option>
                  <option value="damaged">Barang Rusak / Afkir (Pengurangan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Jumlah Perubahan</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={formQty}
                  onChange={(e) => setFormQty(Number(e.target.value))}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Catatan Wajib / Keterangan
                </label>
                <Input
                  required
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Opname stock opname harian"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending ? "Memproses..." : "Simpan Mutasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
