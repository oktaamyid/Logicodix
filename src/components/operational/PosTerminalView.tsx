"use client";

import { useState, useTransition } from "react";
import { formatIDR, cn } from "@/lib/utils";
import { posCheckoutAction, type PosReceipt } from "@/app/dashboard/operational/actions";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PosProductItem {
  id: string;
  sku: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
}

export interface PosCategoryItem {
  id: string;
  name: string;
}

interface CartItem {
  product: PosProductItem;
  quantity: number;
}

interface PosTerminalViewProps {
  products: PosProductItem[];
  categories: PosCategoryItem[];
  storeId: string;
  storeName: string;
}

export function PosTerminalView({
  products,
  categories,
  storeId,
  storeName,
}: PosTerminalViewProps) {
  const [productList, setProductList] = useState<PosProductItem[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Checkout Form State
  const [customerName, setCustomerName] = useState("Pelanggan Umum");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "bank_transfer">("cash");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<PosReceipt | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter Products
  const filteredProducts = productList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discountAmount);
  const change = Math.max(0, cashGiven - total);

  // Add to cart
  const handleAddToCart = (product: PosProductItem) => {
    if (product.stockQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Stok produk "${product.name}" hanya tersisa ${product.stockQuantity}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Modify quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stockQuantity) {
              alert(`Stok maksimal untuk "${item.product.name}" adalah ${item.product.stockQuantity}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashGiven(0);
    setCustomerName("Pelanggan Umum");
    setErrorMessage(null);
  };

  // Quick cash buttons
  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMessage(null);

    if (paymentMethod === "cash" && cashGiven < total && cashGiven > 0) {
      setErrorMessage("Nominal uang tunai yang diterima kurang dari total belanja.");
      return;
    }

    startTransition(async () => {
      const payload = {
        storeId,
        customerName: customerName.trim() || "Pelanggan Umum",
        paymentMethod,
        discountAmount: Number(discountAmount) || 0,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await posCheckoutAction(payload);

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      // Update local product stocks
      setProductList((prev) =>
        prev.map((prod) => {
          const inCart = cart.find((c) => c.product.id === prod.id);
          if (inCart) {
            return {
              ...prod,
              stockQuantity: Math.max(0, prod.stockQuantity - inCart.quantity),
            };
          }
          return prod;
        })
      );

      setCompletedReceipt(res.data);
      handleClearCart();
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Katalog & Pencarian Kasir (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Kategori Toolbar */}
        <div className="bg-card p-4 rounded-xl border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu, produk, atau SKU kasir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          {/* Kategori Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Semua Menu ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
                  selectedCategory === c.id
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">Produk tidak ditemukan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Coba sesuaikan kata kunci pencarian atau kategori
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOut = p.stockQuantity <= 0;
              const isLow = p.stockQuantity <= 5 && !isOut;
              const inCartItem = cart.find((c) => c.product.id === p.id);

              return (
                <button
                  key={p.id}
                  disabled={isOut}
                  onClick={() => handleAddToCart(p)}
                  className={cn(
                    "text-left p-3.5 rounded-xl border bg-card transition-all flex flex-col justify-between relative group select-none",
                    isOut
                      ? "opacity-50 cursor-not-allowed bg-muted/30"
                      : "hover:border-emerald-500 hover:shadow-sm active:scale-[0.98]"
                  )}
                >
                  {/* Cart Indicator Badge */}
                  {inCartItem && (
                    <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md">
                      {inCartItem.quantity}
                    </span>
                  )}

                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      {p.sku}
                    </div>
                    <div className="font-semibold text-sm text-foreground line-clamp-2 mt-0.5">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatIDR(p.sellingPrice)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        isOut
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : isLow
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isOut ? "Habis" : `${p.stockQuantity} ${p.unit}`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Kolom Kanan: Keranjang & Panel Kasir (5 Cols) */}
      <div className="lg:col-span-5 bg-card rounded-xl border shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-base text-foreground">Keranjang Kasir</h3>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} item
            </span>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
              className="h-8 text-xs text-muted-foreground hover:text-red-600"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer Input */}
        <div>
          <label className="text-xs font-semibold text-foreground">Nama Pelanggan</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 h-9 text-xs"
            placeholder="Pelanggan Umum / Nama Meja"
          />
        </div>

        {/* Cart Item List */}
        <div className="divide-y divide-border max-h-60 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Keranjang masih kosong</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Klik produk di katalog untuk menambahkan pesanan
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-foreground truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatIDR(item.product.sellingPrice)} x {item.quantity} ={" "}
                    <span className="font-semibold text-foreground">
                      {formatIDR(item.product.sellingPrice * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                    className="h-7 w-7 rounded border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                    className="h-7 w-7 rounded border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="h-7 w-7 ml-1 text-muted-foreground hover:text-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ringkasan Biaya & Diskon */}
        {cart.length > 0 && (
          <div className="space-y-2 pt-3 border-t text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-foreground">
                {formatIDR(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Diskon Toko (Rp)</span>
              <Input
                type="number"
                min={0}
                max={subtotal}
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-28 h-8 text-right font-mono text-xs"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t text-sm font-bold">
              <span>Total Tagihan</span>
              <span className="text-lg font-mono text-emerald-600 dark:text-emerald-400">
                {formatIDR(total)}
              </span>
            </div>

            {/* Metode Pembayaran */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition-colors",
                    paymentMethod === "cash"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Banknote className="h-4 w-4 mb-1" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition-colors",
                    paymentMethod === "qris"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <QrCode className="h-4 w-4 mb-1" />
                  <span>QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition-colors",
                    paymentMethod === "bank_transfer"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Tunai & Kembalian Calculator */}
            {paymentMethod === "cash" && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2 border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Uang Diterima:</span>
                  <Input
                    type="number"
                    min={0}
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                    className="w-32 h-8 text-right font-mono text-xs"
                    placeholder="0"
                  />
                </div>

                {/* Quick cash pills */}
                <div className="flex flex-wrap gap-1 justify-end">
                  <button
                    onClick={() => handleQuickCash(total)}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono text-muted-foreground"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 150000, 200000].map((amt) => {
                    if (amt >= total) {
                      return (
                        <button
                          key={amt}
                          onClick={() => handleQuickCash(amt)}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono text-muted-foreground"
                        >
                          {amt / 1000}rb
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                {cashGiven >= total && (
                  <div className="flex justify-between items-baseline pt-1 border-t text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Kembalian</span>
                    <span className="font-mono text-sm">{formatIDR(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Checkout Button */}
            <Button
              disabled={isPending || cart.length === 0}
              onClick={handleCheckout}
              className="w-full mt-3 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
            >
              {isPending ? "Memproses Transaksi..." : `Selesaikan Bayar • ${formatIDR(total)}`}
            </Button>
          </div>
        )}
      </div>

      {/* Modal Struk Kasir Digital (Digital Receipt) */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="text-center border-b pb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-foreground">{completedReceipt.storeName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                No: {completedReceipt.orderNumber}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(completedReceipt.createdAt).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground pb-1">
                <span>Pelanggan:</span>
                <span className="font-medium text-foreground">{completedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pb-2 border-b">
                <span>Pembayaran:</span>
                <span className="uppercase font-semibold text-foreground">
                  {completedReceipt.paymentMethod}
                </span>
              </div>

              {/* Items */}
              <div className="py-2 space-y-1 divide-y divide-border">
                {completedReceipt.items.map((it, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between">
                    <div>
                      <div className="font-medium text-foreground">{it.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {it.quantity} x {formatIDR(it.price)}
                      </div>
                    </div>
                    <div className="font-mono font-medium text-foreground">
                      {formatIDR(it.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatIDR(completedReceipt.subtotalAmount)}</span>
                </div>
                {completedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span className="font-mono">-{formatIDR(completedReceipt.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                  <span>Total Transaksi</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatIDR(completedReceipt.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-xs h-9"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Struk</span>
              </Button>
              <Button
                className="flex-1 gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCompletedReceipt(null)}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Transaksi Baru</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
