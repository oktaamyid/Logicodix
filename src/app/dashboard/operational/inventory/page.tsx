import { Suspense } from "react";
import Link from "next/link";
import {
  getActiveMerchantStore,
  getStockMovementsAction,
  getProductsAction,
} from "@/app/dashboard/operational/actions";
import { InventoryAuditView } from "@/components/operational/InventoryAuditView";
import { AlertCircle } from "lucide-react";

export default async function InventoryPage() {
  const storeRes = await getActiveMerchantStore();

  if (!storeRes.success) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-8 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-600" />
        <h3 className="text-lg font-bold">Toko Belum Terdaftar</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {storeRes.error ||
            "Anda belum memiliki profil toko UMKM aktif. Silakan lakukan pendaftaran toko terlebih dahulu."}
        </p>
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-emerald-700 text-white rounded-md text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          Mulai Onboarding Toko
        </Link>
      </div>
    );
  }

  const { storeId, storeName } = storeRes.data;

  const [movementsRes, productsRes] = await Promise.all([
    getStockMovementsAction(storeId),
    getProductsAction(storeId),
  ]);

  const initialMovements = movementsRes.success ? movementsRes.data : [];
  const products = productsRes.success
    ? productsRes.data.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        unit: p.unit,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="border-b pb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Mutasi Stok & Opname
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {storeName}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Audit trail riwayat stok masuk (restock), penjualan kasir & online, penyesuaian opname fisik, serta barang rusak.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 rounded-xl border bg-muted/20 animate-pulse" />}>
        <InventoryAuditView
          initialMovements={initialMovements}
          products={products}
          storeId={storeId}
        />
      </Suspense>
    </div>
  );
}
