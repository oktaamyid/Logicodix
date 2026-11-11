import { getCurrentUserStore, getFinancialSummary } from "@/lib/actions/management/finance";
import { getBusinessAnalytics } from "@/lib/actions/management/analytics";
import { InventoryAnalyticsCards } from "@/components/management/InventoryAnalyticsCards";
import { RevenueTrendChart } from "@/components/management/RevenueTrendChart";
import { BusinessSmartInsights } from "@/components/management/BusinessSmartInsights";
import { AlertCircle, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
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
  const [analytics, financeSummary] = await Promise.all([
    getBusinessAnalytics(storeId, 30),
    getFinancialSummary(storeId, 30),
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
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Analitik Penjualan & Optimasi Bisnis
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {storeName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Wawasan performa penjualan, deteksi perputaran barang fast-moving, peringatan deadstock, dan proyeksi restock.
          </p>
        </div>
      </div>

      {/* KPI Cards Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Omzet 30 Hari
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(analytics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total omzet transaksi terselesaikan
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {analytics.totalOrders}
          </div>
          <p className="text-xs text-muted-foreground">
            Pesanan dari Kasir POS & Storefront
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Rata-rata Order (AOV)
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(analytics.averageOrderValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Nilai belanja per transaksi pelanggan
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Laba Kotor (Gross Profit)
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(analytics.grossProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total omzet dikurangi total modal (HPP)
          </p>
        </div>
      </div>

      {/* Grafik Tren Omzet Penjualan */}
      <RevenueTrendChart trend={analytics.revenueTrend} />

      {/* Rekomendasi Aksi Bisnis Cerdas (AI Insights) */}
      <BusinessSmartInsights
        deadstock={analytics.deadstockProducts}
        restockAlerts={analytics.restockRecommendations}
        profitMarginPercent={financeSummary.profitMarginPercent}
        averageOrderValue={analytics.averageOrderValue}
      />

      {/* Algoritma Optimasi Inventori: Fast-Moving, Deadstock, & Restock */}
      <InventoryAnalyticsCards
        fastMoving={analytics.fastMovingProducts}
        deadstock={analytics.deadstockProducts}
        restockAlerts={analytics.restockRecommendations}
      />
    </div>
  );
}
