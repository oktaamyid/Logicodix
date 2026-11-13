import { getCurrentUserStore, getFinancialSummary } from "@/lib/actions/management/finance";
import { getBusinessAnalytics } from "@/lib/actions/management/analytics";
import { InventoryAnalyticsCards } from "@/components/management/InventoryAnalyticsCards";
import { RevenueTrendChart } from "@/components/management/RevenueTrendChart";
import { BusinessSmartInsights } from "@/components/management/BusinessSmartInsights";
import { DateRangeSelector } from "@/components/management/DateRangeSelector";
import { BEPForecastCards } from "@/components/management/BEPForecastCards";
import { ManagementEmptyState } from "@/components/management/ManagementEmptyState";
import { MLAnalyticsPanel } from "@/components/management/MLAnalyticsPanel";
import { AlertCircle, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage(props: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const periodParam = searchParams?.period || "30d";
  const days =
    periodParam === "7d"
      ? 7
      : periodParam === "90d"
      ? 90
      : periodParam === "all"
      ? "all"
      : 30;

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
    getBusinessAnalytics(storeId, days),
    getFinancialSummary(storeId, days),
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
              Laporan Penjualan & Kesehatan Stok
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {storeName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau barang paling laris, barang yang lama belum terjual, perkiraan omzet, dan kapan stok perlu ditambah.
          </p>
        </div>

        <DateRangeSelector />
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
              Rata-rata Nilai Belanja
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(analytics.averageOrderValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Rata-rata uang belanja per 1 kali transaksi
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Untung Kotor
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(analytics.grossProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total pemasukan dikurangi harga modal barang
          </p>
        </div>
      </div>

      {/* Grafik Tren Omzet Penjualan */}
      <RevenueTrendChart trend={analytics.revenueTrend} />

      {/* Jika belum ada transaksi sama sekali */}
      {analytics.totalOrders === 0 && (
        <ManagementEmptyState type="analytics" storeName={storeName} />
      )}

      {/* Kalkulator Titik Impas (BEP) & Proyeksi Finansial (Forecast) */}
      <BEPForecastCards
        totalRevenue={analytics.totalRevenue}
        totalCost={analytics.totalCost}
        totalExpense={financeSummary.totalExpense}
        totalOrders={analytics.totalOrders}
        profitMarginPercent={financeSummary.profitMarginPercent}
      />

      {/* Prediksi Omzet (Holt+OLS) & Klasterisasi Risiko Produk (In-App ML) */}
      <MLAnalyticsPanel
        forecast={analytics.mlForecast}
        productScores={analytics.mlProductScores}
      />

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
