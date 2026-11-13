import { TrendingUp, PackageCheck, AlertTriangle, RefreshCw } from "lucide-react";

interface AnalyticsDashboardProps {
  fastMoving: {
    id: string;
    name: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    currentStock: number;
  }[];
  deadstock: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    costPrice: number;
    tiedUpCapital: number;
    daysInactive: number;
  }[];
  restockAlerts: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    threshold: number;
    daysOfStockLeft: number;
    urgency: "critical" | "warning" | "normal";
  }[];
}

export function InventoryAnalyticsCards({
  fastMoving,
  deadstock,
  restockAlerts,
}: AnalyticsDashboardProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Fast-Moving (Top Performer) */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Produk Paling Laris
            </h3>
            <p className="text-xs text-muted-foreground">
              Barang yang paling banyak dibeli pelanggan
            </p>
          </div>
        </div>

        {fastMoving.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg">
            Belum ada data penjualan tercatat.
          </div>
        ) : (
          <div className="space-y-3">
            {fastMoving.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{idx + 1}
                    </span>
                    <span>{p.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Terjual: <span className="font-medium text-emerald-600 font-bold">{p.unitsSold} pcs</span> • Sisa: {p.currentStock}
                  </div>
                </div>
                <div className="text-right font-semibold text-foreground">
                  {formatIDR(p.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Deadstock (Modal Tertahan) */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Barang Belum Laku
            </h3>
            <p className="text-xs text-muted-foreground">
              0 Penjualan: Uang modal tertahan di gudang
            </p>
          </div>
        </div>

        {deadstock.length === 0 ? (
          <div className="text-center py-6 text-emerald-700 dark:text-emerald-400 text-xs border border-dashed rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
            Semua barang di toko Anda tercatat laku terjual.
          </div>
        ) : (
          <div className="space-y-3">
            {deadstock.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Stok: {p.currentStock} pcs • Tidak aktif {p.daysInactive} hari
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-600 dark:text-rose-400">
                    {formatIDR(p.tiedUpCapital)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Modal Tertahan</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Restock Alerts (Days of Inventory) */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Barang Perlu Segera Ditambah
            </h3>
            <p className="text-xs text-muted-foreground">
              Stok menipis dan berisiko habis
            </p>
          </div>
        </div>

        {restockAlerts.length === 0 ? (
          <div className="text-center py-6 text-emerald-700 dark:text-emerald-400 text-xs border border-dashed rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
            Semua jumlah stok barang masih aman.
          </div>
        ) : (
          <div className="space-y-3">
            {restockAlerts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Sisa: <span className="font-bold text-amber-700 dark:text-amber-300">{p.currentStock} pcs</span> (Batas: {p.threshold})
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.urgency === "critical"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {p.urgency === "critical" ? "KRITIS" : "RESTOCK"}
                  </span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Est. habis dlm {p.daysOfStockLeft} hari
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

