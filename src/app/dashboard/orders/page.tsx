import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema/core";
import { getStoreOrdersAction } from "@/app/(market)/actions";
import { OrderManagementTable } from "@/components/market/OrderManagementTable";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cari toko milik merchant aktif
  let currentStore = null;
  if (user) {
    currentStore = await db.query.stores.findFirst({
      where: (tbl, { eq }) => eq(tbl.ownerId, user.id),
    });
  }

  // Jika belum ada toko, ambil toko pertama untuk preview/development jika ada
  if (!currentStore) {
    currentStore = await db.query.stores.findFirst();
  }

  const orderResult = currentStore
    ? await getStoreOrdersAction(currentStore.id)
    : { success: true, data: [] };

  const orders = orderResult.success && orderResult.data ? orderResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Pesanan Masuk</h2>
          <p className="text-sm text-muted-foreground">
            Pantau dan tindak lanjuti pesanan pelanggan dari Storefront Online dan transaksi WhatsApp.
          </p>
        </div>

        <Link href="/orders/vouchers">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Tag className="h-4 w-4" />
            <span>Kelola Voucher Diskon</span>
          </Button>
        </Link>
      </div>

      {currentStore ? (
        <OrderManagementTable
          initialOrders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            channel: o.channel,
            status: o.status,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress,
            subtotalAmount: o.subtotalAmount,
            discountAmount: o.discountAmount,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod,
            notes: o.notes,
            createdAt: o.createdAt,
          }))}
          storeId={currentStore.id}
        />
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center bg-card">
          <p className="font-semibold text-sm">Toko Belum Terdaftar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Silakan selesaikan proses onboarding toko untuk mengaktifkan modul pesanan.
          </p>
        </div>
      )}
    </div>
  );
}
