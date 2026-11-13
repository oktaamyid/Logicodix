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
    label: "Paling Laris & Untung",
    className: "bg-emerald-100 text-emerald-900",
  },
  "Volume Driver": {
    label: "Laris (Untung Tipis)",
    className: "bg-blue-100 text-blue-900",
  },
  "Stockout Risk": {
    label: "Stok Hampir Habis",
    className: "bg-amber-100 text-amber-950",
  },
  "Capital Trap": {
    label: "Belum Laku (Modal Tertahan)",
    className: "bg-rose-100 text-rose-900",
  },
  Standard: {
    label: "Penjualan Biasa",
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
          label: "Penjualan Naik",
          icon: TrendingUp,
          badgeClass: "bg-emerald-100 text-emerald-900",
        }
      : forecast.trendDirection === "declining"
      ? {
          label: "Penjualan Turun",
          icon: TrendingDown,
          badgeClass: "bg-rose-100 text-rose-900",
        }
      : {
          label: "Penjualan Stabil",
          icon: Minus,
          badgeClass: "bg-slate-100 text-slate-800",
        };

  const TrendIcon = trendMeta.icon;

  return (
    <section
      aria-label="Perkiraan Penjualan dan Kesehatan Produk"
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
              Perkiraan Penjualan & Kondisi Stok Produk
            </h3>
            <p className="text-xs text-muted-foreground">
              Dihitung otomatis dari riwayat penjualan harian untuk membantu Anda
              memperkirakan pemasukan dan mengatur stok barang.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs font-semibold text-foreground self-start sm:self-center">
          Akurasi Data: {forecast.confidenceScore}% ({forecast.sampleDaysCount} hari catatan)
        </span>
      </div>

      {/* Forecast Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Perkiraan Omzet 7 Hari ke Depan
            </span>
            <p className="font-mono text-xl font-bold text-foreground">
              {formatIDR(forecast.predictedNext7Days)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Rata-rata harian saat ini: {formatIDR(forecast.dailyExpectedBaseline)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Perkiraan Omzet 30 Hari ke Depan
            </span>
            <p className="font-mono text-xl font-bold text-primary">
              {formatIDR(forecast.predictedNext30Days)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Estimasi pemasukan 1 bulan penuh
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Rata-rata Perubahan Harian
            </span>
            <p className="font-mono text-xl font-bold text-foreground">
              {forecast.slopePerDay >= 0 ? "+" : ""}
              {formatIDR(forecast.slopePerDay)}/hari
            </p>
            <p className="text-[11px] text-muted-foreground">
              Kenaikan atau penurunan omzet per hari
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Arah Penjualan Toko
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
              Dilihat dari catatan transaksi terakhir
            </p>
          </div>
        </div>

        {/* Product Multi-Feature Clustering Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Daftar Kesehatan & Prioritas Produk ({productScores.length} Barang)
              </h4>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Dinilai dari kecepatan laku, untung bersih, dan sisa modal</span>
            </span>
          </div>

          {productScores.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Belum ada barang yang terdaftar. Tambahkan produk pertama Anda di
              menu Daftar Produk untuk melihat analisis penjualan.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3">Status Barang</th>
                    <th className="px-4 py-3 text-right">Nilai</th>
                    <th className="px-4 py-3 text-right">Terjual/Hari</th>
                    <th className="px-4 py-3 text-right">Untung (%)</th>
                    <th className="px-4 py-3 text-right">Diskon Aman</th>
                    <th className="px-4 py-3">Saran Tindakan</th>
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
                            Kode: {item.sku}
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
