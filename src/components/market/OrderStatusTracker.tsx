"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Printer,
  Copy,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OrderDetailData {
  order: {
    id: string;
    orderNumber: string;
    channel: string;
    status: string;
    customerName: string;
    customerPhone: string | null;
    customerAddress: string | null;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    notes: string | null;
    createdAt: Date | string;
    completedAt: Date | string | null;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    city: string;
    whatsappNumber: string;
    address: string | null;
  } | null | undefined;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
    subtotal: number;
  }>;
}

const ORDER_STEPS = [
  { key: "pending", label: "Menunggu Konfirmasi", desc: "Penjual sedang meninjau pesanan Anda" },
  { key: "confirmed", label: "Dikonfirmasi", desc: "Pesanan telah disetujui penjual" },
  { key: "processing", label: "Sedang Diproses", desc: "Produk sedang disiapkan / dikemas" },
  { key: "completed", label: "Selesai", desc: "Pesanan telah diterima pembeli" },
];

export function OrderStatusTracker({ data }: { data: OrderDetailData }) {
  const { order, store, items } = data;
  const [copied, setCopied] = useState(false);

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);

  const copyInvoiceNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 print:bg-white print:p-0">
      {/* Header Bar */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
        <div className="container mx-auto px-4 max-w-3xl h-14 flex items-center justify-between">
          <Link
            href={store ? `/store/${store.slug}` : "/explore"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{store ? `Kembali ke ${store.name}` : "Direktori UMKM"}</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Bukti Pesanan</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-3xl py-8 space-y-6">
        {/* Title & Order ID */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Lacak Status Pesanan
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-xl font-mono font-extrabold">{order.orderNumber}</h1>
                <button
                  onClick={copyInvoiceNumber}
                  title="Salin No. Pesanan"
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied && (
                  <span className="text-[11px] font-medium text-emerald-600">Tersalin!</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dipesan pada {formatDateTime(order.createdAt)}
              </p>
            </div>

            {store && (
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-muted-foreground">Toko Penjual:</span>
                <Link
                  href={`/store/${store.slug}`}
                  className="font-bold text-sm block text-primary hover:underline"
                >
                  {store.name}
                </Link>
                <span className="text-xs text-muted-foreground">{store.city}</span>
              </div>
            )}
          </div>

          {/* Stepper Status Real-time */}
          {isCancelled ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-destructive shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-destructive">Pesanan Dibatalkan</p>
                <p className="text-muted-foreground mt-0.5">
                  Pesanan ini telah dibatalkan oleh pihak toko atau pemesan.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-xl border p-3.5 space-y-1.5 transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-muted bg-muted/20 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isCurrent ? "text-primary" : isDone ? "text-emerald-700 dark:text-emerald-300" : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail Produk & Tagihan */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm">Rincian Item & Pembayaran</h2>
          </div>

          <div className="divide-y text-xs">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold">{item.productNameSnapshot}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {formatIDR(item.unitPriceSnapshot)} x {item.quantity}
                  </p>
                </div>
                <span className="font-semibold">{formatIDR(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Ringkasan Biaya */}
          <div className="border-t pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal Produk:</span>
              <span>{formatIDR(order.subtotalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Potongan Diskon Kupon:</span>
                <span>-{formatIDR(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base text-foreground border-t pt-2">
              <span>Total Tagihan:</span>
              <span className="text-primary">{formatIDR(order.totalAmount)}</span>
            </div>
          </div>

          {/* Informasi Tambahan */}
          <div className="rounded-xl bg-muted/30 p-4 border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground text-[11px] block font-medium">
                Penerima & Alamat:
              </span>
              <p className="font-bold mt-0.5">{order.customerName}</p>
              {order.customerPhone && (
                <p className="font-mono text-muted-foreground text-[11px]">{order.customerPhone}</p>
              )}
              <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">
                {order.customerAddress || "-"}
              </p>
            </div>

            <div>
              <span className="text-muted-foreground text-[11px] block font-medium">
                Metode Pembayaran:
              </span>
              <p className="font-bold uppercase mt-0.5">{order.paymentMethod}</p>

              {store && (
                <div className="mt-3">
                  <a
                    href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Halo ${store.name}, saya ingin menanyakan perkembangan pesanan nomor ${order.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-semibold print:hidden"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Hubungi Toko via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
