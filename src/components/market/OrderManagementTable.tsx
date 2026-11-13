"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { updateOrderStatusAction } from "@/app/(market)/actions";
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Phone,
  Search,
  Download,
  Calendar,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface OrderItemData {
  id: string;
  orderNumber: string;
  channel: "pos" | "online_storefront" | "whatsapp";
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "qris" | "bank_transfer";
  notes: string | null;
  createdAt: Date | string;
}

interface OrderManagementTableProps {
  initialOrders: OrderItemData[];
  storeId: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Menunggu Konfirmasi",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Dikonfirmasi",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    icon: CheckCircle,
  },
  processing: {
    label: "Sedang Diproses",
    color: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    icon: Truck,
  },
  completed: {
    label: "Selesai",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
};

export function OrderManagementTable({
  initialOrders,
  storeId,
}: OrderManagementTableProps) {
  const [ordersList, setOrdersList] = useState<OrderItemData[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter gabungan Tab Status & Query Pencarian (No. Order / Nama / WhatsApp)
  const filteredOrders = ordersList.filter((o) => {
    const matchesTab = activeTab === "all" || o.status === activeTab;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q))
    );
  });

  const handleUpdateStatus = (
    orderId: string,
    newStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled"
  ) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        storeId,
        orderId,
        status: newStatus,
      });

      if (res.success) {
        setOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    });
  };

  // Ekspor Rekap Pesanan ke CSV
  const exportToCSV = () => {
    if (ordersList.length === 0) return;

    const headers = [
      "No. Pesanan",
      "Tanggal",
      "Kanal",
      "Status",
      "Nama Pelanggan",
      "No. WhatsApp",
      "Alamat",
      "Metode Bayar",
      "Subtotal",
      "Diskon",
      "Total Tagihan",
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.channel,
      o.status,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone || ""}"`,
      `"${(o.customerAddress || "").replace(/"/g, '""')}"`,
      o.paymentMethod,
      o.subtotalAmount,
      o.discountAmount,
      o.totalAmount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Pesanan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Search & Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari no. pesanan, nama pelanggan, atau no. WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="gap-1.5 text-xs h-9 shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Ekspor Rekap ({filteredOrders.length} Pesanan)</span>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: `Semua (${ordersList.length})` },
          { id: "pending", label: "Menunggu" },
          { id: "confirmed", label: "Dikonfirmasi" },
          { id: "processing", label: "Diproses" },
          { id: "completed", label: "Selesai" },
          { id: "cancelled", label: "Dibatalkan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-foreground text-background font-bold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
          <p className="font-semibold text-sm">Tidak ada pesanan ditemukan</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery
              ? "Tidak ada pesanan yang sesuai dengan kata kunci pencarian Anda."
              : "Pesanan masuk dari pelanggan online dan WhatsApp akan tampil otomatis di sini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`rounded-xl border bg-card p-4 hover:border-foreground/30 transition-all cursor-pointer ${
                    isSelected ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{order.orderNumber}</span>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {order.channel === "pos" ? "POS Kasir" : "Online Store"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm mt-1">{order.customerName}</h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t mt-3 pt-3 text-xs text-muted-foreground">
                    <span>{formatDateTime(order.createdAt)}</span>
                    <span className="font-bold text-foreground text-sm">
                      {formatIDR(order.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Detail Drawer / Panel */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="rounded-xl border bg-card p-5 space-y-5 sticky top-20 shadow-xs">
                <div className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Rincian Pesanan
                    </span>
                    <Link
                      href={`/order-status/${selectedOrder.orderNumber}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                    >
                      <span>Halaman Publik</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <h3 className="font-mono font-black text-base mt-1">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Nama Pemesan:</span>
                    <p className="font-bold text-sm">{selectedOrder.customerName}</p>
                  </div>

                  {selectedOrder.customerPhone && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground text-[11px]">No. WhatsApp:</span>
                        <p className="font-mono font-semibold">{selectedOrder.customerPhone}</p>
                      </div>
                      <a
                        href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        <Phone className="h-3 w-3" /> Hubungi
                      </a>
                    </div>
                  )}

                  {selectedOrder.customerAddress && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Alamat Pengiriman:</span>
                      <p className="font-medium bg-muted/30 p-2 rounded-lg mt-1 text-[11px] leading-relaxed">
                        {selectedOrder.customerAddress}
                      </p>
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Catatan:</span>
                      <p className="italic text-muted-foreground text-[11px]">{selectedOrder.notes}</p>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>{formatIDR(selectedOrder.subtotalAmount)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Diskon:</span>
                        <span>-{formatIDR(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                      <span>Total Tagihan:</span>
                      <span className="text-primary font-black">
                        {formatIDR(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="border-t pt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Perbarui Status Pesanan:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Button
                      size="sm"
                      variant={selectedOrder.status === "confirmed" ? "default" : "outline"}
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "confirmed")}
                      className="text-xs h-8"
                    >
                      Konfirmasi
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === "processing" ? "default" : "outline"}
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                      className="text-xs h-8"
                    >
                      Proses
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === "completed" ? "default" : "outline"}
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                      className="text-xs h-8 text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Selesai
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                    >
                      Batalkan
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-card/40 text-xs">
                Pilih salah satu pesanan untuk melihat detail dan mengubah status pengiriman.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
