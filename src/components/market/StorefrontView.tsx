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
  Copy,
  ExternalLink,
  Info,
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
  const [activeProductDetail, setActiveProductDetail] = useState<ProductItem | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bank_transfer" | "cash">("qris");
  const [voucherCode, setVoucherCode] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    totalAmount: number;
  } | null>(null);

  const categoriesList = Array.from(
    new Set(products.map((p) => p.categoryName || "Umum"))
  );

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => (p.categoryName || "Umum") === selectedCategory);

  const addToCart = (product: ProductItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const targetQty = existing.quantity + quantity;
        if (targetQty > product.stockQuantity) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: targetQty } : i
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stockQuantity) }];
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

  const matchedVoucher = vouchers.find(
    (v) => v.code.toUpperCase() === voucherCode.trim().toUpperCase()
  );
  const discountAmount =
    matchedVoucher && subtotal >= matchedVoucher.minPurchase
      ? Math.min(matchedVoucher.discountAmount, subtotal)
      : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      setErrorMessage("Terjadi gangguan jaringan saat memproses pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInvoiceText = () => {
    if (!orderSuccess) return;
    navigator.clipboard.writeText(orderSuccess.orderNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Direktori UMKM</span>
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Buka Keranjang Belanja"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Keranjang</span>
            {totalItemsCount > 0 && (
              <span className="bg-primary-foreground text-primary rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ml-0.5">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Store Banner & Brand Info */}
      <section className="border-b bg-muted/20">
        <div className="h-40 sm:h-52 w-full overflow-hidden bg-muted relative">
          {store.bannerUrl ? (
            <img
              src={store.bannerUrl}
              alt={`Banner ${store.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-secondary/30 flex items-center justify-center">
              <span className="font-semibold text-sm text-muted-foreground tracking-wide uppercase">
                {store.name}
              </span>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative -mt-12 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 border-background bg-card shadow-sm flex items-center justify-center text-primary font-bold text-2xl overflow-hidden shrink-0">
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={`Logo ${store.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                  {store.subsector}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {store.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {store.city}
                  </span>
                  <span>•</span>
                  <span>{products.length} Produk Tersedia</span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Halo ${store.name}, saya tertarik dengan produk usaha Anda di Niagarupa.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-end"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hubungi Toko via WhatsApp</span>
            </a>
          </div>

          {store.description && (
            <p className="text-xs text-muted-foreground max-w-3xl pb-6 border-t pt-4 leading-relaxed">
              {store.description}
            </p>
          )}
        </div>
      </section>

      {/* Main Content & Products */}
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Kupon Promo jika tersedia */}
        {vouchers.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex flex-wrap items-center gap-3">
            <Tag className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Kupon Promo Spesial Toko:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {vouchers.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVoucherCode(v.code);
                      setIsCartOpen(true);
                    }}
                    title="Klik untuk gunakan kode"
                    className="inline-flex items-center gap-1 font-mono font-bold bg-white dark:bg-card text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 text-[11px] hover:border-amber-500 transition-colors"
                  >
                    <span>{v.code}</span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      (Potongan {formatIDR(v.discountAmount)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Kategori Produk */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-foreground text-background font-bold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({products.length})
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-foreground text-background font-bold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid Produk */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center bg-card">
            <p className="text-sm font-semibold text-muted-foreground">
              Belum ada produk aktif yang tersedia untuk kategori ini.
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
                  className="rounded-xl border bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between"
                >
                  <div
                    onClick={() => setActiveProductDetail(product)}
                    className="cursor-pointer group"
                  >
                    {/* Gambar Produk */}
                    <div className="aspect-square bg-muted/30 relative flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-center p-3 text-muted-foreground/50 font-medium text-xs">
                          {product.categoryName || "Karya UMKM"}
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-1 rounded">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Informasi Produk */}
                    <div className="p-3.5 space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {product.categoryName || "Umum"}
                      </div>
                      <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="text-xs font-extrabold text-foreground pt-1">
                        {formatIDR(product.sellingPrice)}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aksi Pembelian */}
                  <div className="p-3.5 pt-0">
                    {inCart ? (
                      <div className="flex items-center justify-between border rounded-lg p-1 bg-muted/30">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted text-foreground"
                          aria-label="Kurangi kuantitas"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={inCart.quantity >= product.stockQuantity}
                          className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted text-foreground disabled:opacity-30"
                          aria-label="Tambah kuantitas"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                        className="w-full text-xs h-8 font-medium rounded-lg"
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

      {/* Modal Detail Produk */}
      {activeProductDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-background rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative aspect-video sm:aspect-2/1 bg-muted">
              {activeProductDetail.imageUrl ? (
                <img
                  src={activeProductDetail.imageUrl}
                  alt={activeProductDetail.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                  Foto Produk Belum Tersedia
                </div>
              )}
              <button
                onClick={() => setActiveProductDetail(null)}
                aria-label="Tutup Rincian"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeProductDetail.categoryName || "Umum"}
                </span>
                <h2 className="text-xl font-bold mt-1 leading-tight">
                  {activeProductDetail.name}
                </h2>
                <div className="text-lg font-black text-primary mt-2">
                  {formatIDR(activeProductDetail.sellingPrice)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    per {activeProductDetail.unit}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Kode SKU Produk:</span>
                  <span className="font-mono font-medium text-foreground">
                    {activeProductDetail.sku}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Ketersediaan Stok:</span>
                  <span
                    className={`font-semibold ${
                      activeProductDetail.stockQuantity > 0
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    {activeProductDetail.stockQuantity > 0
                      ? `${activeProductDetail.stockQuantity} ${activeProductDetail.unit} siap dipesan`
                      : "Stok Sedang Habis"}
                  </span>
                </div>
              </div>

              {activeProductDetail.description && (
                <div className="border-t pt-3 space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Deskripsi Produk</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeProductDetail.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveProductDetail(null)}
                  className="flex-1 text-xs"
                >
                  Tutup
                </Button>
                <Button
                  disabled={activeProductDetail.stockQuantity <= 0}
                  onClick={() => {
                    addToCart(activeProductDetail);
                    setActiveProductDetail(null);
                  }}
                  className="flex-1 text-xs font-semibold gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Tambahkan ke Keranjang</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
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
                aria-label="Tutup Keranjang"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6 flex-1">
              {orderSuccess ? (
                /* Sukses Checkout & Invoice View */
                <div className="text-center py-6 space-y-5">
                  <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg">Pesanan Siap Dikirim!</h3>
                    <p className="text-xs text-muted-foreground">
                      Nomor Invoice Pemesanan Anda:
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border font-mono font-bold text-sm mt-1">
                      <span>{orderSuccess.orderNumber}</span>
                      <button
                        onClick={copyInvoiceText}
                        className="text-muted-foreground hover:text-foreground text-xs"
                        title="Salin No. Invoice"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {copiedInvoice && (
                      <p className="text-[11px] text-emerald-600 font-medium">Nomor invoice tersalin!</p>
                    )}
                  </div>

                  <div className="rounded-xl border p-4 bg-muted/20 text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toko Tujuan:</span>
                      <span className="font-bold">{store.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tagihan:</span>
                      <span className="font-black text-primary text-sm">
                        {formatIDR(orderSuccess.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data pesanan Anda telah tercatat. Silakan klik tombol di bawah untuk langsung terhubung ke WhatsApp penjual dan mendapatkan instruksi pembayaran.
                  </p>

                  <a
                    href={orderSuccess.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Lanjut Konfirmasi ke WhatsApp</span>
                  </a>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderSuccess(null);
                      setIsCartOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    Selesai & Belanja Lagi
                  </Button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Keranjang belanja Anda masih kosong.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs"
                  >
                    Pilih Produk di Etalase
                  </Button>
                </div>
              ) : (
                <>
                  {/* Daftar Item Keranjang */}
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
                            aria-label="Kurangi"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-30"
                            aria-label="Tambah"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1"
                            aria-label="Hapus produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Pemesanan */}
                  <form onSubmit={handleCheckout} className="space-y-4 border-t pt-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Informasi Pemesan
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
                      <label className="text-[11px] font-medium">Nomor WhatsApp Aktif</label>
                      <Input
                        required
                        placeholder="Contoh: 081234567890"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">
                        Alamat Pengiriman / Opsi Ambil Sendiri
                      </label>
                      <Input
                        required
                        placeholder="Sebutkan alamat kirim atau 'Ambil di Tempat'..."
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Pilihan Pembayaran</label>
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
                      <label className="text-[11px] font-medium">Kode Kupon Toko</label>
                      <Input
                        placeholder="Contoh: DISKON10"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">Catatan Pemesanan (Opsional)</label>
                      <Input
                        placeholder="Contoh: Titipkan di pos satpam, packing ekstra kardus"
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
                          <span>Diskon Kupon</span>
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
                        "Sedang Memproses..."
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Buat Pesanan & Kirim ke WhatsApp</span>
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
