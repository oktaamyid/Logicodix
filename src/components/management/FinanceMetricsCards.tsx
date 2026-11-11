import { ArrowDownRight, ArrowUpRight, Wallet, Percent, ShoppingBag } from "lucide-react";

interface FinanceMetricsCardsProps {
  totalIncome: number;
  totalExpense: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrdersCompleted: number;
}

export function FinanceMetricsCards({
  totalIncome,
  totalExpense,
  grossProfit,
  netProfit,
  profitMarginPercent,
  totalOrdersCompleted,
}: FinanceMetricsCardsProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const isProfitable = netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pemasukan / Omzet */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total Pemasukan (Omzet)
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{totalOrdersCompleted} pesanan selesai</span>
          </p>
        </div>
      </div>

      {/* Beban Pengeluaran */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Beban Operasional
          </span>
          <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatIDR(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Bahan baku, sewa, gaji, & operasional
          </p>
        </div>
      </div>

      {/* Laba Kotor (Gross Profit) */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Laba Kotor
          </span>
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatIDR(grossProfit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pendapatan dikurangi modal produk (HPP)
          </p>
        </div>
      </div>

      {/* Laba Bersih (Net Profit) */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Laba Bersih
          </span>
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              isProfitable
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                : "bg-red-100 dark:bg-red-950/60 text-red-600"
            }`}
          >
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              isProfitable
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatIDR(netProfit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Net Margin: <span className="font-semibold">{profitMarginPercent}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

