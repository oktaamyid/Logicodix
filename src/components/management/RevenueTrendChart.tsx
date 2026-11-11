interface RevenueTrendProps {
  trend: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
}

export function RevenueTrendChart({ trend }: RevenueTrendProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDateLabel = (dStr: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length < 3) return dStr;
    return `${parts[2]}/${parts[1]}`;
  };

  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 100000);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Tren Omzet Harian (7 Hari Terakhir)
          </h3>
          <p className="text-xs text-muted-foreground">
            Grafik fluktuasi perolehan omzet dan volume pesanan selesai.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500 inline-block" />
            <span className="text-muted-foreground">Omzet Penjualan</span>
          </div>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
          Belum ada data transaksi yang selesai dalam 7 hari terakhir.
        </div>
      ) : (
        <div className="pt-4">
          <div className="h-48 flex items-end gap-3 sm:gap-6 border-b pb-2">
            {trend.map((item) => {
              const heightPercent = Math.max(
                Math.round((item.revenue / maxRevenue) * 100),
                8
              );
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[11px] font-medium py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    {formatIDR(item.revenue)} ({item.orderCount} order)
                  </div>

                  <div className="w-full max-w-[42px] bg-amber-100 dark:bg-amber-950/50 rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-md group-hover:brightness-110 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatDateLabel(item.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

