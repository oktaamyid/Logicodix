import { getCurrentUserStore, getFinancialSummary } from "@/lib/actions/management/finance";
import { getBusinessAnalytics } from "@/lib/actions/management/analytics";
import { FinanceMetricsCards } from "@/components/management/FinanceMetricsCards";
import { AlertCircle, Store, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function OverviewPage() {
  const storeRes = await getCurrentUserStore();

  if (!storeRes.success) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-600" />
        <h3 className="text-lg font-bold">Toko Belum Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {storeRes.error ||
            "Anda belum memiliki profil toko UMKM aktif. Silakan lakukan pendaftaran toko terlebih dahulu."}
        </p>
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Mulai Onboarding Toko
        </Link>
      </div>
    );
  }

  const { storeId, storeName } = storeRes.data;

  const [financeSummary, analytics] = await Promise.all([
    getFinancialSummary(storeId, 30),
    getBusinessAnalytics(storeId, 30),
  ]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="border-b pb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Ringkasan Usaha UMKM
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {storeName}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Kondisi performa bisnis, kesehatan keuangan, dan ringkasan aktivitas operasional terkini.
        </p>
      </div>

      {/* Ringkasan Finansial Utama */}
      <FinanceMetricsCards
        totalIncome={financeSummary.totalIncome}
        totalExpense={financeSummary.totalExpense}
        grossProfit={financeSummary.grossProfit}
        netProfit={financeSummary.netProfit}
        profitMarginPercent={financeSummary.profitMarginPercent}
        totalOrdersCompleted={financeSummary.totalOrdersCompleted}
      />

      {/* Quick Action Navigation & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Sorotan Finansial & Buku Kas */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Buku Kas & Arus Keuangan
            </h3>
            <Link
              href="/dashboard/management/finance"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Kelola Buku Kas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Beban operasional tercatat sebesar{" "}
            <span className="font-semibold text-rose-600">
              {formatIDR(financeSummary.totalExpense)}
            </span>{" "}
            dengan margin keuntungan bersih {financeSummary.profitMarginPercent}%.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/management/finance"
              className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
            >
              <span>+ Catat Pengeluaran Baru</span>
            </Link>
          </div>
        </div>

        {/* Box 2: Sorotan Analitik & Restock */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Kesehatan Stok & Inventori
            </h3>
            <Link
              href="/dashboard/management/analytics"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Lihat Analitik Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Terdapat{" "}
            <span className="font-bold text-amber-600">
              {analytics.restockRecommendations.length} produk
            </span>{" "}
            perlu di-restock segera, dan{" "}
            <span className="font-bold text-rose-600">
              {analytics.deadstockProducts.length} produk deadstock
            </span>{" "}
            yang menahan perputaran modal usaha.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/operational/inventory"
              className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <span>Buka Manajemen Stok & Opname</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
