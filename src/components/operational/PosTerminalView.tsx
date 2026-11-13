"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatIDR, cn } from "@/lib/utils";
import { posCheckoutAction } from "@/app/dashboard/operational/actions";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Receipt,
  Printer,
  X,
  User,
  Tag,
  PackageOpen,
  Camera,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Store,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

export interface PosProductItem {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  categoryId: string | null;
}

export interface PosCategoryItem {
  id: string;
  name: string;
}

interface CartItem {
  product: PosProductItem;
  quantity: number;
}

interface HeldOrder {
  id: string;
  label: string;
  customerName: string;
  items: CartItem[];
  discountValue: number;
  discountMode: "rp" | "percent";
  createdAt: string;
}

export interface PosReceipt {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  customerName: string;
  cashReceived?: number;
  changeAmount?: number;
  items: { name: string; quantity: number; price: number; subtotal: number }[];
  createdAt: string;
}

interface PosFeedback {
  type: "success" | "warning" | "error";
  message: string;
}

interface PosTerminalViewProps {
  storeId: string;
  storeName: string;
  products: PosProductItem[];
  categories: PosCategoryItem[];
}

function playCashierBeep(kind: "ok" | "error") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "ok" ? "sine" : "triangle";
    osc.frequency.value = kind === "ok" ? 1040 : 320;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === "ok" ? 0.09 : 0.18));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (kind === "ok" ? 0.1 : 0.2));
  } catch {
    // Abaikan jika browser memblokir AudioContext
  }
}

export function PosTerminalView({
  storeId,
  storeName,
  products,
  categories,
}: PosTerminalViewProps) {
  const [isPending, startTransition] = useTransition();
  const [productList, setProductList] = useState<PosProductItem[]>(products);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [customerName, setCustomerName] = useState("Pelanggan Umum");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "bank_transfer">("cash");
  const [discountMode, setDiscountMode] = useState<"rp" | "percent">("rp");
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Scanner & Feedback State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [feedback, setFeedback] = useState<PosFeedback | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<PosReceipt | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((type: PosFeedback["type"], message: string) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productList.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);
      const matchesCat =
        selectedCategory === "all" || item.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [productList, searchQuery, selectedCategory]);

  // Map quantity di keranjang agar cepat dicek per kartu produk
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cart]);

  // Add to cart (returns true jika berhasil ditambah)
  const handleAddToCart = useCallback(
    (product: PosProductItem, notifyOnAdd = false): boolean => {
      if (product.stockQuantity <= 0) {
        playCashierBeep("error");
        showFeedback("error", `Stok "${product.name}" sedang habis.`);
        return false;
      }

      let added = true;
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stockQuantity) {
            added = false;
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

      if (!added) {
        playCashierBeep("error");
        showFeedback(
          "warning",
          `Stok "${product.name}" hanya tersisa ${product.stockQuantity} ${product.unit}.`
        );
        return false;
      }

      if (notifyOnAdd) {
        playCashierBeep("ok");
        showFeedback("success", `Ditambahkan: ${product.name}`);
      }
      return true;
    },
    [showFeedback]
  );

  // Tangani kode hasil scan kamera atau scanner USB
  const handleBarcodeMatch = useCallback(
    (rawCode: string, fromCamera = false) => {
      const code = rawCode.trim().toLowerCase();
      if (!code) return;

      const exactSku = productList.find((p) => p.sku.toLowerCase() === code);
      if (exactSku) {
        const ok = handleAddToCart(exactSku, true);
        if (ok && !fromCamera) {
          setSearchQuery("");
        }
        return;
      }

      const nameOrPartial = productList.filter(
        (p) =>
          p.sku.toLowerCase().includes(code) ||
          p.name.toLowerCase().includes(code)
      );

      if (nameOrPartial.length === 1) {
        const ok = handleAddToCart(nameOrPartial[0], true);
        if (ok && !fromCamera) {
          setSearchQuery("");
        }
        return;
      }

      playCashierBeep("error");
      if (fromCamera) {
        setSearchQuery(rawCode.trim());
        showFeedback(
          "warning",
          `Kode "${rawCode.trim()}" tidak cocok persis dengan SKU mana pun. Daftar difilter otomatis.`
        );
      } else {
        showFeedback("warning", `Produk dengan kode "${rawCode.trim()}" tidak ditemukan.`);
      }
    },
    [productList, handleAddToCart, showFeedback]
  );

  // Update cart quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty > item.product.stockQuantity) {
            showFeedback(
              "warning",
              `Maksimal stok "${item.product.name}" adalah ${item.product.stockQuantity} ${item.product.unit}.`
            );
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const computedDiscount = useMemo(() => {
    if (discountInput <= 0 || subtotal <= 0) return 0;
    if (discountMode === "percent") {
      const pct = Math.min(100, discountInput);
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, discountInput);
  }, [discountInput, discountMode, subtotal]);

  const grandTotal = Math.max(0, subtotal - computedDiscount);
  const changeAmount =
    paymentMethod === "cash" && cashReceived >= grandTotal
      ? cashReceived - grandTotal
      : 0;
  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleResetCart = () => {
    setCart([]);
    setDiscountInput(0);
    setCashReceived(0);
    setCustomerName("Pelanggan Umum");
  };

  // Tahan / Parkir Struk
  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) return;
    const nowLabel = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      label:
        customerName.trim() && customerName.trim() !== "Pelanggan Umum"
          ? customerName.trim()
          : `Antrean ${heldOrders.length + 1}`,
      customerName: customerName.trim() || "Pelanggan Umum",
      items: cart,
      discountValue: discountInput,
      discountMode,
      createdAt: nowLabel,
    };
    setHeldOrders((prev) => [...prev, newHeld]);
    handleResetCart();
    showFeedback("success", `Transaksi "${newHeld.label}" disimpan sementara.`);
  };

  const handleResumeHeldOrder = (heldId: string) => {
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;

    // Jika keranjang saat ini ada isinya, simpan dulu ke antrean
    if (cart.length > 0) {
      const nowLabel = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const parkedCurrent: HeldOrder = {
        id: `hold-${Date.now()}`,
        label:
          customerName.trim() && customerName.trim() !== "Pelanggan Umum"
            ? customerName.trim()
            : `Antrean ${heldOrders.length + 1}`,
        customerName: customerName.trim() || "Pelanggan Umum",
        items: cart,
        discountValue: discountInput,
        discountMode,
        createdAt: nowLabel,
      };
      setHeldOrders((prev) => [
        ...prev.filter((h) => h.id !== heldId),
        parkedCurrent,
      ]);
    } else {
      setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    }

    setCart(target.items);
    setCustomerName(target.customerName);
    setDiscountInput(target.discountValue);
    setDiscountMode(target.discountMode);
    setCashReceived(0);
    showFeedback("success", `Melanjutkan transaksi "${target.label}".`);
  };

  // Handle Checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;

    if (paymentMethod === "cash" && cashReceived > 0 && cashReceived < grandTotal) {
      showFeedback(
        "error",
        `Uang tunai kurang ${formatIDR(grandTotal - cashReceived)} dari total tagihan.`
      );
      return;
    }

    startTransition(async () => {
      const res = await posCheckoutAction({
        storeId,
        customerName: customerName.trim() || "Pelanggan Umum",
        paymentMethod,
        discountAmount: computedDiscount,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      if (res.success) {
        const usedCash =
          paymentMethod === "cash"
            ? cashReceived >= grandTotal
              ? cashReceived
              : grandTotal
            : undefined;
        const computedChange =
          paymentMethod === "cash" && usedCash !== undefined
            ? Math.max(0, usedCash - grandTotal)
            : undefined;

        const receiptData: PosReceipt = {
          ...res.data,
          cashReceived: usedCash,
          changeAmount: computedChange,
          items: cart.map((c) => ({
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.sellingPrice,
            subtotal: c.product.sellingPrice * c.quantity,
          })),
          createdAt: new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        };

        // Deduct local stock immediately
        setProductList((prev) =>
          prev.map((prod) => {
            const bought = cart.find((c) => c.product.id === prod.id);
            if (!bought) return prod;
            return {
              ...prod,
              stockQuantity: Math.max(0, prod.stockQuantity - bought.quantity),
            };
          })
        );

        setCompletedReceipt(receiptData);
        handleResetCart();
      } else {
        showFeedback("error", res.error || "Gagal memproses transaksi kasir.");
      }
    });
  }, [
    cart,
    paymentMethod,
    cashReceived,
    grandTotal,
    storeId,
    customerName,
    computedDiscount,
    showFeedback,
  ]);

  // Keyboard shortcuts untuk kasir (F2 fokus scan/cari, F4 bayar, Esc tutup struk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && !isPending && !completedReceipt && !isScannerOpen) {
          handleCheckout();
        }
      } else if (e.key === "Escape" && completedReceipt) {
        e.preventDefault();
        setCompletedReceipt(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, isPending, completedReceipt, isScannerOpen, handleCheckout]);

  return (
    <div className="space-y-4">
      {/* Top Cashier Status Bar */}
      <div className="bg-card border rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{storeName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Kasir Aktif
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan barcode kamera atau USB, lalu tekan Enter untuk tambah ke keranjang.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted font-mono">
            F2: Cari / Scan
          </span>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted font-mono">
            F4: Bayar
          </span>
          {heldOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {heldOrders.map((held) => (
                <button
                  key={held.id}
                  type="button"
                  onClick={() => handleResumeHeldOrder(held.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  title={`Lanjutkan pesanan ${held.label}`}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>{held.label}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    ({held.items.reduce((s, i) => s + i.quantity, 0)})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Non-blocking Cashier Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium animate-in fade-in-50",
            feedback.type === "success" &&
              "bg-emerald-50 border-emerald-200 text-emerald-800",
            feedback.type === "warning" &&
              "bg-amber-50 border-amber-200 text-amber-800",
            feedback.type === "error" && "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Tutup pesan"
            className="p-1 hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Katalog & Pencarian Kasir (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search, Scan Kamera & Kategori Toolbar */}
          <div className="bg-card p-4 rounded-xl border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Cari nama produk, ketik SKU, atau scan barcode (Enter)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      e.preventDefault();
                      handleBarcodeMatch(searchQuery, false);
                    }
                  }}
                  className="pl-9 h-11 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="min-h-[44px] px-4 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
              >
                <Camera className="h-4 w-4" />
                <span className="text-xs font-semibold">Scan Barcode</span>
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px]",
                  selectedCategory === "all"
                    ? "bg-emerald-700 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Semua ({productList.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px]",
                    selectedCategory === c.id
                      ? "bg-emerald-700 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-card rounded-xl border p-12 text-center space-y-2">
              <PackageOpen className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-medium text-foreground">
                Tidak ada produk yang cocok
              </p>
              <p className="text-xs text-muted-foreground">
                Coba ubah kata kunci pencarian, scan ulang barcode, atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const inCartQty = cartQtyMap.get(product.id) || 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(product, false)}
                    className={cn(
                      "group relative text-left bg-card p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[126px]",
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed bg-muted/40"
                        : inCartQty > 0
                        ? "border-emerald-600 ring-1 ring-emerald-600/30 bg-emerald-50/30 active:scale-[0.98]"
                        : "hover:border-emerald-600 hover:shadow-md active:scale-[0.98]"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {product.sku}
                        </span>
                        {inCartQty > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                            {inCartQty}x
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : product.stockQuantity <= 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {isOutOfStock
                              ? "Habis"
                              : `Stok ${product.stockQuantity}`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                        {product.name}
                      </p>
                    </div>

                    <div className="pt-3 flex items-baseline justify-between border-t border-dashed mt-2">
                      <span className="text-sm font-extrabold text-emerald-700">
                        {formatIDR(product.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        /{product.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Keranjang & Pembayaran Kasir (5 Cols) */}
        <div className="lg:col-span-5 bg-card border rounded-xl shadow-sm flex flex-col sticky top-4 overflow-hidden">
          {/* Header Keranjang */}
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-foreground">
                Struk Transaksi ({totalCartUnits} item)
              </h3>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHoldCurrentOrder}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  title="Tahan transaksi ini sementara untuk melayani pelanggan lain"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span>Tahan</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCart}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  title="Kosongkan keranjang"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {/* List Item Keranjang */}
          <div className="p-4 space-y-2.5 max-h-[290px] overflow-y-auto divide-y divide-border">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground space-y-1.5">
                <ShoppingCart className="h-7 w-7 mx-auto opacity-30" />
                <p className="text-xs font-medium">Keranjang kasir masih kosong</p>
                <p className="text-[11px]">
                  Klik produk di kiri atau tekan &quot;Scan Barcode&quot; untuk mulai transaksi.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatIDR(item.product.sellingPrice)} / {item.product.unit}
                    </p>
                  </div>

                  {/* Qty Stepper */}
                  <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      aria-label={`Kurangi ${item.product.name}`}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="w-7 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      aria-label={`Tambah ${item.product.name}`}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="w-20 text-right">
                    <p className="text-xs font-bold text-foreground">
                      {formatIDR(item.product.sellingPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Pembayaran & Checkout */}
          <div className="p-4 border-t bg-muted/10 space-y-4">
            {/* Pelanggan & Diskon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="h-3 w-3" /> Nama Pelanggan
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="Pelanggan Umum"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Diskon
                  </label>
                  <div className="flex rounded-md border overflow-hidden text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountMode("rp");
                        setDiscountInput(0);
                      }}
                      className={cn(
                        "px-1.5 py-0.5",
                        discountMode === "rp"
                          ? "bg-emerald-700 text-white"
                          : "bg-background text-muted-foreground"
                      )}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountMode("percent");
                        setDiscountInput(0);
                      }}
                      className={cn(
                        "px-1.5 py-0.5",
                        discountMode === "percent"
                          ? "bg-emerald-700 text-white"
                          : "bg-background text-muted-foreground"
                      )}
                    >
                      %
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={discountMode === "percent" ? 100 : undefined}
                  value={discountInput || ""}
                  onChange={(e) => setDiscountInput(Number(e.target.value) || 0)}
                  className="h-9 text-xs"
                  placeholder={discountMode === "percent" ? "0 %" : "0"}
                />
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[48px] p-2 rounded-lg border text-xs font-medium transition-all gap-1",
                    paymentMethod === "cash"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700"
                      : "bg-card hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[48px] p-2 rounded-lg border text-xs font-medium transition-all gap-1",
                    paymentMethod === "qris"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700"
                      : "bg-card hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[48px] p-2 rounded-lg border text-xs font-medium transition-all gap-1",
                    paymentMethod === "bank_transfer"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700"
                      : "bg-card hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Nominal Tunai & Pecahan Cepat */}
            {paymentMethod === "cash" && cart.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/40 border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Uang Diterima
                  </span>
                  <button
                    type="button"
                    onClick={() => setCashReceived(grandTotal)}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Uang Pas
                  </button>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                  placeholder="Masukkan nominal uang tunai..."
                  className="h-10 text-sm font-bold bg-background"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[10000, 20000, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-background border hover:border-emerald-600 text-foreground transition-colors"
                    >
                      {nominal === 10000
                        ? "10rb"
                        : nominal === 20000
                        ? "20rb"
                        : nominal === 50000
                        ? "50rb"
                        : "100rb"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed">
                  <span className="text-xs font-medium text-muted-foreground">
                    Kembalian
                  </span>
                  <span
                    className={cn(
                      "text-base font-extrabold",
                      cashReceived > 0 && cashReceived < grandTotal
                        ? "text-red-600"
                        : "text-emerald-700"
                    )}
                  >
                    {cashReceived > 0 && cashReceived < grandTotal
                      ? `Kurang ${formatIDR(grandTotal - cashReceived)}`
                      : formatIDR(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Ringkasan Total */}
            <div className="space-y-1.5 pt-2 border-t text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              {computedDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>
                    Diskon{" "}
                    {discountMode === "percent" ? `(${discountInput}%)` : ""}
                  </span>
                  <span>-{formatIDR(computedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-base font-extrabold text-foreground pt-1.5">
                <span>Total Bayar</span>
                <span className="text-emerald-700 text-xl">
                  {formatIDR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              disabled={cart.length === 0 || isPending}
              onClick={handleCheckout}
              className="w-full min-h-[48px] text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "Memproses Transaksi..." : "Bayar & Cetak Struk"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Scanner Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        continuous={false}
        title="Scan Barcode Kasir"
        description="Arahkan kamera ke barcode barang. Produk otomatis masuk ke keranjang dan pemindai langsung tertutup."
        onScanSuccess={(decodedText) => handleBarcodeMatch(decodedText, true)}
      />

      {/* Modal Struk Transaksi Selesai */}
      {completedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Struk Pembayaran"
        >
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Header Hijau */}
            <div className="bg-emerald-700 p-5 text-white text-center space-y-1 relative print:hidden">
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                aria-label="Tutup struk"
                className="absolute right-3 top-3 text-white/80 hover:text-white p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-base">Pembayaran Berhasil</h3>
              <p className="text-xs text-emerald-100">
                Stok & Buku Kas telah diperbarui otomatis
              </p>
            </div>

            {/* Isi Struk Thermal */}
            <div className="p-5 space-y-4 font-mono text-xs bg-white text-slate-900">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                <p className="font-bold text-sm uppercase">{storeName}</p>
                <p className="text-[11px] text-slate-500">
                  No. Struk: {completedReceipt.orderNumber}
                </p>
                <p className="text-[11px] text-slate-500">
                  {completedReceipt.createdAt}
                </p>
                <p className="text-[11px] text-slate-600">
                  Pelanggan: {completedReceipt.customerName}
                </p>
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                {completedReceipt.items.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {item.quantity} x {formatIDR(item.price)}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatIDR(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {completedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon</span>
                    <span>-{formatIDR(completedReceipt.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>TOTAL</span>
                  <span>{formatIDR(completedReceipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Metode Bayar</span>
                  <span className="uppercase">{completedReceipt.paymentMethod}</span>
                </div>
                {completedReceipt.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Tunai</span>
                      <span>{formatIDR(completedReceipt.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-900">
                      <span>Kembalian</span>
                      <span>{formatIDR(completedReceipt.changeAmount || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                Terima kasih telah berbelanja di {storeName}
              </p>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t bg-muted/20 flex items-center gap-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] gap-1.5 text-xs"
              >
                <Printer className="h-4 w-4" />
                Cetak Struk
              </Button>
              <Button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5"
              >
                <Receipt className="h-4 w-4" />
                Transaksi Baru
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
