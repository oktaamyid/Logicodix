interface BreakdownProps {
  categories: {
    category: string;
    label: string;
    amount: number;
    percentage: number;
  }[];
  totalExpense: number;
}

export function ExpenseBreakdownCard({ categories, totalExpense }: BreakdownProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">
          Struktur Beban Pengeluaran
        </h3>
        <p className="text-xs text-muted-foreground">
          Komposisi pengeluaran operasional usaha dalam 30 hari terakhir.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
          Belum ada beban pengeluaran yang dicatat.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground font-semibold">
                  {formatIDR(item.amount)} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

