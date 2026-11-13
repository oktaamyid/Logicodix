import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Layers,
} from "lucide-react";
import type {
  RevenueForecastResult,
  ProductMLScore,
  ProductClusterLabel,
} from "@/lib/ai/ml-engine";

interface MLAnalyticsPanelProps {
  forecast: RevenueForecastResult;
  productScores: ProductMLScore[];
}

function formatIDR(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

const CLUSTER_BADGE: Record<
  ProductClusterLabel,
  { label: string; className: string }
> = {
  "Star Performer": {
    label: "Produk Unggulan",
    className: "bg-emerald-100 text-emerald-900",
  },
  "Volume Driver": {
    label: "Penggerak Volume",
    className: "bg-blue-100 text-blue-900",
  },
  "Stockout Risk": {
    label: "Waspada Stockout",
    className: "bg-amber-100 text-amber-950",
  },
  "Capital Trap": {
    label: "Modal Tertahan",
    className: "bg-rose-100 text-rose-900",
  },
  Standard: {
    label: "Performa Stabil",
    className: "bg-slate-100 text-slate-800",
  },
};

export function MLAnalyticsPanel({
  forecast,
  productScores,
}: MLAnalyticsPanelProps) {
  const trendMeta =
    forecast.trendDirection === "growing"
      ? {
          label: "Tren Bertumbuh",
          icon: TrendingUp,
          badgeClass: "bg-emerald-100 text-emerald-900",
        }
      : forecast.trendDirection === "declining"
      ? {
          label: "Tren Menurun",
          icon: TrendingDown,
          badgeClass: "bg-rose-100 text-rose-900",
        }
      : {
          label: "Tren Stabil",
          icon: Minus,
          badgeClass: "bg-slate-100 text-slate-800",
        };

  const TrendIcon = trendMeta.icon;

  return (
    <section
      aria-label="Prediksi dan Klasterisasi Machine Learning"
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border bg-secondary/40 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-emerald-400 shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Prediksi Permintaan & Klasterisasi Produk (In-App ML)
            </h3>
            <p className="text-xs text-muted-foreground">
              Dihitung langsung menggunakan {forecast.algorithmLabel} serta
              Min-Max Multi-Feature Scoring.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs font-semibold text-foreground self-start sm:self-center">
          Confidence: {forecast.confidenceScore}% ({forecast.sampleDaysCount} hari data)
        </span>
      </div>

      {/* Forecast Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Proyeksi Omzet 7 Hari
            </span>
            <p className="font-mono text-xl font-bold text-foreground">
              {formatIDR(forecast.predictedNext7Days)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Baseline harian: {formatIDR(forecast.dailyExpectedBaseline)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Proyeksi Omzet 30 Hari
            </span>
            <p className="font-mono text-xl font-bold text-primary">
              {formatIDR(forecast.predictedNext30Days)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Horizon teredam (damped Holt)
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Kemiringan Tren (OLS Slope)
            </span>
            <p className="font-mono text-xl font-bold text-foreground">
              {forecast.slopePerDay >= 0 ? "+" : ""}
              {formatIDR(forecast.slopePerDay)}/hari
            </p>
            <p className="text-[11px] text-muted-foreground">
              Laju perubahan omzet harian
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Arah Pertumbuhan
            </span>
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${trendMeta.badgeClass}`}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{trendMeta.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Berdasarkan regresi deret waktu
            </p>
          </div>
        </div>

        {/* Product Multi-Feature Clustering Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Skor Kinerja & Klaster Risiko SKU ({productScores.length} Produk)
              </h4>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Bobot: 50% Velocity, 35% Margin, 15% Efisiensi Modal</span>
            </span>
          </div>

          {productScores.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Belum ada SKU produk aktif untuk diklasterisasi oleh model.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Produk & SKU</th>
                    <th className="px-4 py-3">Klaster ML</th>
                    <th className="px-4 py-3 text-right">Skor</th>
                    <th className="px-4 py-3 text-right">Laju/Hari</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                    <th className="px-4 py-3 text-right">Batas Diskon Aman</th>
                    <th className="px-4 py-3">Rekomendasi Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {productScores.slice(0, 8).map((item) => {
                    const badge = CLUSTER_BADGE[item.cluster];
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {item.sku}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {item.score}/100
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {item.dailyVelocity} unit
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {item.marginPercent}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          Maks {item.safeMaxDiscountPercent}%
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs leading-relaxed">
                          {item.recommendedAction}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
