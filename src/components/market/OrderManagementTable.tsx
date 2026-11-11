"use client";

import { useState, useTransition } from "react";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { updateOrderStatusAction } from "@/app/(market)/actions";
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders =
    activeTab === "all"
      ? ordersList
      : ordersList.filter((o) => o.status === activeTab);

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

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="font-semibold text-sm">Tidak ada pesanan masuk</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pesanan dari pembeli di storefront online atau WhatsApp akan tampil otomatis di sini.
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
                  className={`rounded-xl border bg-card p-4 hover:shadow-xs transition-all cursor-pointer ${
                    isSelected ? "border-primary ring-1 ring-primary/20" : "hover:border-primary/40"
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
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Rincian Pesanan
                  </span>
                  <h3 className="font-mono font-black text-base">{selectedOrder.orderNumber}</h3>
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
                    Perbarui Status:
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
                      className="text-xs h-8 text-emerald-600 hover:text-emerald-700"
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

