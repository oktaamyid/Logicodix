import {
  getCurrentUserStore,
  getFinancialSummary,
  getRecentTransactions,
} from "@/lib/actions/management/finance";
import { RecordExpenseDialog } from "@/components/management/RecordExpenseDialog";
import { FinanceMetricsCards } from "@/components/management/FinanceMetricsCards";
import { FinancialTransactionsTable } from "@/components/management/FinancialTransactionsTable";
import { ExpenseBreakdownCard } from "@/components/management/ExpenseBreakdownCard";
import { ExportFinanceReportButton } from "@/components/management/ExportFinanceReportButton";
import { DateRangeSelector } from "@/components/management/DateRangeSelector";
import { BEPForecastCards } from "@/components/management/BEPForecastCards";
import { ManagementEmptyState } from "@/components/management/ManagementEmptyState";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function FinancePage(props: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const periodParam = searchParams?.period || "30d";
  const daysBack =
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

  // Mengambil ringkasan keuangan sesuai filter periode
  const summary = await getFinancialSummary(storeId, daysBack);
  const recentTransactions = await getRecentTransactions(storeId, 50);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Buku Kas & Laba Rugi
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {storeName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau arus kas masuk dari POS/Online, catat beban operasional, dan hitung laba bersih secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeSelector />
          <ExportFinanceReportButton
            storeName={storeName}
            entries={recentTransactions}
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            netProfit={summary.netProfit}
          />
          <RecordExpenseDialog storeId={storeId} />
        </div>
      </div>

      {/* Kartu Metrik Ringkasan Finansial */}
      <FinanceMetricsCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        grossProfit={summary.grossProfit}
        netProfit={summary.netProfit}
        profitMarginPercent={summary.profitMarginPercent}
        totalOrdersCompleted={summary.totalOrdersCompleted}
      />

      {/* Kalkulator Titik Impas (BEP) & Proyeksi Finansial (Forecast) */}
      <BEPForecastCards
        totalRevenue={summary.totalIncome}
        totalCost={summary.totalIncome - summary.grossProfit}
        totalExpense={summary.totalExpense}
        totalOrders={summary.totalOrdersCompleted}
        profitMarginPercent={summary.profitMarginPercent}
      />

      {/* Jika belum ada transaksi dan belum ada pengeluaran sama sekali */}
      {summary.totalIncome === 0 && summary.totalExpense === 0 && (
        <ManagementEmptyState type="finance" storeName={storeName} />
      )}

      {/* Grid: Struktur Beban Pengeluaran & Riwayat Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Breakdown Beban Pengeluaran */}
        <div className="lg:col-span-1">
          <ExpenseBreakdownCard
            categories={summary.breakdownByCategory}
            totalExpense={summary.totalExpense}
          />
        </div>

        {/* Kolom Kanan: Tabel Riwayat Arus Kas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Riwayat Transaksi Buku Kas
            </h3>
            <span className="text-xs text-muted-foreground">
              {recentTransactions.length} entri terbaru
            </span>
          </div>
          <FinancialTransactionsTable
            entries={recentTransactions}
            storeId={storeId}
          />
        </div>
      </div>
    </div>
  );
}
