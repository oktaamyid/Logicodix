"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ScanBarcode,
  Plus,
  Minus,
  CheckCircle2,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";

interface DemoProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  hpp: number;
  stock: number;
  unit: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "p1",
    sku: "8991002101",
    name: "Arabika Gayo 250g",
    price: 75000,
    hpp: 48000,
    stock: 24,
    unit: "bks",
  },
  {
    id: "p2",
    sku: "8991002102",
    name: "Drip Bag Liberika",
    price: 55000,
    hpp: 30000,
    stock: 15,
    unit: "box",
  },
  {
    id: "p3",
    sku: "8991002103",
    name: "Es Kopi Susu Gula Aren",
    price: 22000,
    hpp: 9500,
    stock: 40,
    unit: "cup",
  },
  {
    id: "p4",
    sku: "8991002104",
    name: "Kue Lumpur Panggang",
    price: 18000,
    hpp: 8500,
    stock: 12,
    unit: "pcs",
  },
];

function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function HomeDemoShowcase() {
  const [activeTab, setActiveTab] = useState<"pos" | "storefront" | "report">(
    "pos"
  );

  // State Demo Kasir POS
  const [cart, setCart] = useState<{ product: DemoProduct; qty: number }[]>([
    { product: DEMO_PRODUCTS[0], qty: 1 },
    { product: DEMO_PRODUCTS[2], qty: 2 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [cashInput, setCashInput] = useState<number>(150000);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [receiptPaid, setReceiptPaid] = useState<boolean>(false);

  const addDemoItem = (product: DemoProduct) => {
    setReceiptPaid(false);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateDemoQty = (id: string, delta: number) => {
    setReceiptPaid(false);
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const handleSimulateScan = () => {
    const randomProduct =
      DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
    addDemoItem(randomProduct);
    setScanNotice(
      `Barcode ${randomProduct.sku} terbaca -> +1 ${randomProduct.name}`
    );
    setTimeout(() => setScanNotice(null), 2500);
  };

  const totalAmount = cart.reduce(
    (sum, i) => sum + i.product.price * i.qty,
    0
  );
  const totalHpp = cart.reduce((sum, i) => sum + i.product.hpp * i.qty, 0);
  const grossProfit = totalAmount - totalHpp;
  const changeAmount =
    paymentMethod === "cash" && cashInput >= totalAmount
      ? cashInput - totalAmount
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="border-b border-border bg-secondary/40 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pos"}
            onClick={() => setActiveTab("pos")}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "pos"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-background text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Demo Kasir POS</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "storefront"}
            onClick={() => setActiveTab("storefront")}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "storefront"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-background text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Katalog WhatsApp</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "report"}
            onClick={() => setActiveTab("report")}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "report"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-background text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Laporan Laba & Stok</span>
          </button>
        </div>

        <span className="text-[11px] font-medium text-muted-foreground">
          Simulasi interaktif tanpa perlu daftar akun
        </span>
      </div>

      {/* Tab 1: Demo Kasir POS */}
      {activeTab === "pos" && (
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Katalog Produk Demo */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                Klik produk atau coba simulasi scan barcode:
              </p>
              <button
                type="button"
                onClick={handleSimulateScan}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <ScanBarcode className="h-3.5 w-3.5 text-emerald-400" />
                <span>Simulasi Scan Barcode</span>
              </button>
            </div>

            {scanNotice && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{scanNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {DEMO_PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addDemoItem(p)}
                  className="text-left rounded-xl border border-border bg-background p-3.5 hover:border-emerald-600 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {p.sku}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Stok {p.stock}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground line-clamp-1">
                    {p.name}
                  </p>
                  <p className="text-sm font-extrabold text-emerald-700">
                    {formatIDR(p.price)}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /{p.unit}
                    </span>
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Struk & Pembayaran Demo */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-background p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-emerald-700" />
                Struk Kasir Demo
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setReceiptPaid(false);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {receiptPaid ? (
              <div className="space-y-3 py-2 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Transaksi Demo Berhasil
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Laba kotor tercatat:{" "}
                    <strong className="text-emerald-700">
                      +{formatIDR(grossProfit)}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptPaid(false)}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Ubah Pesanan Demo
                </button>
              </div>
            ) : cart.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Klik produk di sebelah kiri untuk mencoba kasir.
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-foreground truncate flex-1">
                        {item.product.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateDemoQty(item.product.id, -1)}
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted"
                          aria-label="Kurangi"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-bold">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDemoQty(item.product.id, 1)}
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted"
                          aria-label="Tambah"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono font-semibold w-20 text-right">
                        {formatIDR(item.product.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`py-1.5 rounded-lg border font-semibold ${
                        paymentMethod === "cash"
                          ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                          : "text-muted-foreground"
                      }`}
                    >
                      Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qris")}
                      className={`py-1.5 rounded-lg border font-semibold ${
                        paymentMethod === "qris"
                          ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                          : "text-muted-foreground"
                      }`}
                    >
                      QRIS
                    </button>
                  </div>

                  {paymentMethod === "cash" && (
                    <div className="flex items-center justify-between gap-2 bg-muted/40 p-2 rounded-lg">
                      <span className="text-muted-foreground">Uang:</span>
                      <div className="flex items-center gap-1">
                        {[totalAmount, 150000, 200000].map((val, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashInput(val)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                              cashInput === val
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-background"
                            }`}
                          >
                            {idx === 0 ? "Pas" : `${val / 1000}rb`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total Bayar</span>
                    <span className="text-emerald-700">
                      {formatIDR(totalAmount)}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Kembalian</span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatIDR(changeAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-semibold">
                    <span>Estimasi Laba Kotor</span>
                    <span className="font-mono">+{formatIDR(grossProfit)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReceiptPaid(true)}
                    className="w-full min-h-[40px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                  >
                    Bayar & Catat Otomatis
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Preview Katalog WhatsApp */}
      {activeTab === "storefront" && (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <p className="text-xs font-bold text-foreground">
                  niagarupa.id/store/kopi-seduh-nusantara
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tampilan etalase publik di HP pembeli
                </p>
              </div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Aktif
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_PRODUCTS.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border p-2.5 space-y-1"
                >
                  <p className="text-xs font-bold text-foreground">{p.name}</p>
                  <p className="text-xs font-extrabold text-emerald-700">
                    {formatIDR(p.price)}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Contoh Pesanan Masuk ke WhatsApp:</p>
              <p className="font-mono text-[11px] leading-relaxed">
                Halo Kopi Seduh Nusantara, saya pesan: 1x Arabika Gayo 250g (Rp
                75.000). Total: Rp 75.000.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Etalase Toko Siap Bagikan ke Bio Instagram & WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pembeli cukup pilih produk, masukkan kupon diskon jika ada, lalu
              pesanan terkirim rapi ke WhatsApp Anda dan tercatat di menu Pesanan
              Masuk.
            </p>
            <Link
              href="/store/kopi-seduh-nusantara"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors"
            >
              <span>Buka Contoh Katalog Asli</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 3: Preview Laporan Laba & Stok */}
      {activeTab === "report" && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Omzet 30 Hari</p>
              <p className="mt-1 text-xl font-extrabold text-foreground">
                Rp 14.850.000
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                182 transaksi selesai
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Modal Barang (HPP)</p>
              <p className="mt-1 text-xl font-extrabold text-foreground">
                Rp 8.420.000
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Terhitung otomatis per item
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-900">
                Untung Bersih
              </p>
              <p className="mt-1 text-xl font-extrabold text-emerald-800">
                Rp 4.930.000
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">
                Sudah dikurangi biaya sewa & listrik
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>
                <strong>Pengingat Stok Otomatis:</strong> Arabika Gayo 250g
                tersisa 3 bks (di bawah batas aman 5 bks).
              </span>
            </div>
            <Link
              href="/register"
              className="font-bold text-amber-900 hover:underline shrink-0"
            >
              Coba di Toko Anda
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
