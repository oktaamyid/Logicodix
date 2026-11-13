interface BEPForecastProps {
  totalRevenue: number;
  totalCost: number; // Total HPP
  totalExpense: number; // Beban operasional (biaya sewa, gaji, utilitas, dll.)
  totalOrders: number;
  profitMarginPercent: number;
}

export function BEPForecastCards({
  totalRevenue,
  totalCost,
  totalExpense,
  totalOrders,
  profitMarginPercent,
}: BEPForecastProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // 1. Perhitungan BEP (Break-Even Point)
  // Rata-rata margin kontribusi per transaksi = (Total Revenue - Total HPP) / Total Orders
  const grossProfit = totalRevenue - totalCost;
  const avgGrossMarginPerOrder =
    totalOrders > 0 ? grossProfit / totalOrders : 0;

  // BEP dalam jumlah transaksi = Total Beban Operasional / Margin Kontribusi per Order
  const bepOrdersNeeded =
    avgGrossMarginPerOrder > 0
      ? Math.ceil(totalExpense / avgGrossMarginPerOrder)
      : 0;

  // BEP dalam nominal rupiah (Target Omzet Minimal agar tidak rugi)
  const grossMarginRatio =
    totalRevenue > 0 ? grossProfit / totalRevenue : 0;
  const bepRevenueNeeded =
    grossMarginRatio > 0 ? Math.round(totalExpense / grossMarginRatio) : totalExpense;

  const bepProgressPercent =
    bepRevenueNeeded > 0
      ? Math.min(Math.round((totalRevenue / bepRevenueNeeded) * 100), 100)
      : 100;

  const isBEPAchieved = totalRevenue >= bepRevenueNeeded && totalExpense > 0;

  // 2. Proyeksi Keuangan Bulan Depan (Forecast)
  // Berdasarkan laju pertumbuhan rata-rata harian (asumsi tren periode 30 hari)
  const dailyRunRate = totalRevenue / 30;
  const projectedRevenueNextMonth = Math.round(dailyRunRate * 30);
  const projectedProfitNextMonth = Math.round(
    projectedRevenueNextMonth * (profitMarginPercent / 100)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Kartu 1: Kalkulator Titik Impas (Break-Even Point) */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Target Balik Modal (Titik Impas)
            </h3>
            <p className="text-xs text-muted-foreground">
              Batas minimal penjualan agar seluruh biaya operasional (sewa, listrik, gaji) tertutup.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isBEPAchieved
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {isBEPAchieved ? "Sudah Balik Modal" : "Belum Balik Modal"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Minimal Omzet agar Tidak Rugi
            </span>
            <div className="text-lg font-bold text-foreground">
              {formatIDR(bepRevenueNeeded)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Total biaya toko: {formatIDR(totalExpense)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Minimal Jumlah Transaksi
            </span>
            <div className="text-lg font-bold text-foreground">
              {bepOrdersNeeded > 0 ? `${bepOrdersNeeded} Transaksi` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Sudah tercatat: {totalOrders} transaksi selesai
            </p>
          </div>
        </div>

        {/* Progress Bar BEP */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Perkembangan Menuju Balik Modal</span>
            <span className="font-bold text-foreground">{bepProgressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isBEPAchieved ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${bepProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kartu 2: Proyeksi Laju Arus Kas Bulan Depan (Forecast) */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Perkiraan Pemasukan Bulan Depan
            </h3>
            <p className="text-xs text-muted-foreground">
              Perkiraan omzet dan keuntungan bersih jika penjualan harian berjalan seperti sekarang.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Perkiraan 30 Hari
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Perkiraan Total Penjualan
            </span>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatIDR(projectedRevenueNextMonth)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Rata-rata per hari: {formatIDR(dailyRunRate)}/hari
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Perkiraan Untung Bersih
            </span>
            <div
              className={`text-lg font-bold ${
                projectedProfitNextMonth >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatIDR(projectedProfitNextMonth)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Dari tingkat untung {profitMarginPercent}%
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-muted-foreground">
          <strong>Kesimpulan:</strong>{" "}
          {projectedProfitNextMonth > 0
            ? "Jika penjualan harian tetap terjaga, toko Anda diperkirakan mendapat keuntungan bersih bulan depan."
            : "Penjualan perlu ditingkatkan atau biaya pengeluaran toko perlu dihemat agar tidak merugi bulan depan."}
        </div>
      </div>
    </div>
  );
}

