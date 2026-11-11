"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store as StoreIcon,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  CreditCard,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPublicOrderAction } from "@/app/(market)/actions";

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  categoryName: string | null;
}

export interface VoucherItem {
  id: string;
  code: string;
  discountAmount: number;
  minPurchase: number;
}

export interface StoreDetail {
  id: string;
  name: string;
  slug: string;
  subsector: string;
  description: string | null;
  city: string;
  whatsappNumber: string;
  address: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface StorefrontViewProps {
  store: StoreDetail;
  products: ProductItem[];
  vouchers: VoucherItem[];
}

export function StorefrontView({ store, products, vouchers }: StorefrontViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bank_transfer" | "cash">("qris");
  const [voucherCode, setVoucherCode] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    totalAmount: number;
  } | null>(null);

  // Kategori unik dari produk
  const categoriesList = Array.from(
    new Set(products.map((p) => p.categoryName || "Umum"))
  );

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => (p.categoryName || "Umum") === selectedCategory);

  // Cart Helpers
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > i.product.stockQuantity) return i;
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  // Cek Voucher Diskon
  const matchedVoucher = vouchers.find(
    (v) => v.code.toUpperCase() === voucherCode.trim().toUpperCase()
  );
  const discountAmount =
    matchedVoucher && subtotal >= matchedVoucher.minPurchase
      ? Math.min(matchedVoucher.discountAmount, subtotal)
      : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await createPublicOrderAction({
        storeId: store.id,
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
        voucherCode: voucherCode.trim() ? voucherCode.trim().toUpperCase() : undefined,
        notes: notes.trim() || undefined,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
        return;
      }

      setOrderSuccess(res.data);
      setCart([]);
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan teknis saat membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Jelajahi UMKM Lainnya</span>
          </Link>

          {/* Floating Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Keranjang</span>
            {totalItemsCount > 0 && (
              <span className="bg-white text-primary rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Store Hero Banner */}
      <div className="relative border-b bg-muted/40">
        <div className="h-40 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-primary/15 via-secondary/20 to-primary/5 flex items-center justify-center">
          {store.bannerUrl ? (
            <img
              src={store.bannerUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <StoreIcon className="h-12 w-12 mx-auto text-primary/40 mb-2" />
              <p className="text-sm font-semibold text-primary/60">Etalase Resmi UMKM</p>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative -mt-12 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-background bg-card shadow-md flex items-center justify-center text-primary font-black text-2xl overflow-hidden shrink-0">
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
                  {store.subsector}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {store.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {store.city}
                  </span>
                  <span>•</span>
                  <span>{products.length} Pilihan Produk</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Contact Button */}
            <a
              href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Halo ${store.name}, saya ingin bertanya mengenai produk Anda di Niagarupa.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-end"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat WhatsApp Toko</span>
            </a>
          </div>

          {store.description && (
            <p className="text-xs text-muted-foreground max-w-2xl pb-6 border-t pt-4">
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* Storefront Products Section */}
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Voucher Banner if available */}
        {vouchers.length > 0 && (
          <div className="rounded-xl border bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex flex-wrap items-center gap-3">
            <Tag className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Kupon Promo Spesial Toko:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {vouchers.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1 font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]"
                  >
                    {v.code} (Hemat {formatIDR(v.discountAmount)})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({products.length})
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center bg-card">
            <p className="text-sm text-muted-foreground">
              Belum ada produk aktif yang tersedia di kategori ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;
              const inCart = cart.find((i) => i.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Product Image */}
                    <div className="aspect-square bg-muted/50 relative flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-center p-2 text-muted-foreground/40 font-bold text-xs">
                          {product.categoryName || "Produk UMKM"}
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-1 rounded">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3.5 space-y-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        {product.categoryName || "Umum"}
                      </div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-xs font-black text-primary pt-0.5">
                        {formatIDR(product.sellingPrice)}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="p-3.5 pt-0">
                    {inCart ? (
                      <div className="flex items-center justify-between border rounded-lg p-1 bg-muted/40">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={inCart.quantity >= product.stockQuantity}
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-foreground disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                        className="w-full text-xs h-8 font-semibold rounded-lg"
                      >
                        + Keranjang
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart & Checkout Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-background h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Header Drawer */}
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base">Keranjang Belanja</h2>
                <span className="text-xs text-muted-foreground">({totalItemsCount} item)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6 flex-1">
              {orderSuccess ? (
                /* Sukses Checkout & WhatsApp Invoice */
                <div className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg">Pesanan Berhasil Dibuat!</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      No. Invoice: {orderSuccess.orderNumber}
                    </p>
                    <p className="text-sm font-bold text-primary mt-2">
                      Total: {formatIDR(orderSuccess.totalAmount)}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pesanan Anda telah tercatat di sistem kami. Klik tombol di bawah untuk langsung terhubung ke WhatsApp penjual dan menyelesaikan pembayaran.
                  </p>

                  <a
                    href={orderSuccess.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Kirim Pesanan ke WhatsApp Toko</span>
                  </a>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderSuccess(null);
                      setIsCartOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    Tutup & Belanja Lagi
                  </Button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Keranjang Anda masih kosong.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs"
                  >
                    Mulai Pilih Produk
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Item List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Daftar Produk
                    </div>
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between border rounded-lg p-2.5 bg-card text-xs gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{item.product.name}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {formatIDR(item.product.sellingPrice)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleCheckout} className="space-y-4 border-t pt-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Data Pemesan
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Nama Lengkap</label>
                      <Input
                        required
                        placeholder="Contoh: Rifa Nabil"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Nomor WhatsApp</label>
                      <Input
                        required
                        placeholder="Contoh: 081234567890"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">
                        Alamat Pengiriman / Catatan Pengambilan
                      </label>
                      <Input
                        required
                        placeholder="Alamat lengkap tujuan kirim atau ambil di toko..."
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Metode Pembayaran</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["qris", "bank_transfer", "cash"] as const).map((method) => (
                          <button
                            type="button"
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`p-2 rounded-lg border text-center text-xs font-semibold uppercase transition-colors ${
                              paymentMethod === method
                                ? "border-primary bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {method === "bank_transfer" ? "Transfer" : method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Kupon Voucher Diskon</label>
                      <Input
                        placeholder="Masukkan kode voucher (opsional)"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Catatan Tambahan (Opsional)</label>
                      <Input
                        placeholder="Contoh: Jangan terlalu pedas, bungkus terpisah"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Ringkasan Biaya */}
                    <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs border">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal Produk</span>
                        <span>{formatIDR(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Diskon Voucher</span>
                          <span>-{formatIDR(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm text-foreground border-t pt-1.5">
                        <span>Total Pembayaran</span>
                        <span className="text-primary font-black">{formatIDR(totalAmount)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full font-bold h-11 text-sm rounded-xl gap-2"
                    >
                      {isSubmitting ? (
                        "Membuat Pesanan..."
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Lanjut ke WhatsApp (Checkout)</span>
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

