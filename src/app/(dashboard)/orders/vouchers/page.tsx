import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getStoreVouchersAction } from "@/app/(market)/actions";
import { VoucherManager } from "@/components/market/VoucherManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VouchersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentStore = null;
  if (user) {
    currentStore = await db.query.stores.findFirst({
      where: (tbl, { eq }) => eq(tbl.ownerId, user.id),
    });
  }

  if (!currentStore) {
    currentStore = await db.query.stores.findFirst();
  }

  const voucherRes = currentStore
    ? await getStoreVouchersAction(currentStore.id)
    : { success: true, data: [] };

  const vouchers = voucherRes.success && voucherRes.data ? voucherRes.data : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Pesanan Masuk</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Kupon Promo & Diskon Toko</h2>
        <p className="text-sm text-muted-foreground">
          Kelola kode diskon khusus untuk mendorong promosi penjualan di micro-storefront Anda.
        </p>
      </div>

      {currentStore ? (
        <VoucherManager initialVouchers={vouchers} storeId={currentStore.id} />
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center bg-card">
          <p className="font-semibold text-sm">Toko Belum Terdaftar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Silakan selesaikan proses onboarding toko terlebih dahulu.
          </p>
        </div>
      )}
    </div>
  );
}
