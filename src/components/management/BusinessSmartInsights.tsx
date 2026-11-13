import { AlertTriangle, TrendingUp, Lightbulb, PackageOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SmartInsightsProps {
  deadstock: {
    id: string;
    name: string;
    tiedUpCapital: number;
    currentStock: number;
    daysInactive: number;
  }[];
  restockAlerts: {
    id: string;
    name: string;
    currentStock: number;
    daysOfStockLeft: number;
    urgency: "critical" | "warning" | "normal";
  }[];
  profitMarginPercent: number;
  averageOrderValue: number;
}

export function BusinessSmartInsights({
  deadstock,
  restockAlerts,
  profitMarginPercent,
  averageOrderValue,
}: SmartInsightsProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalDeadstockCapital = deadstock.reduce(
    (acc, curr) => acc + curr.tiedUpCapital,
    0
  );

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Saran Langkah Praktis untuk Toko Anda
          </h3>
          <p className="text-xs text-muted-foreground">
            Rekomendasi otomatis berdasarkan catatan penjualan dan sisa stok barang Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Insight 1: Deadstock Bundling Recommendation */}
        {deadstock.length > 0 ? (
          <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
              <PackageOpen className="h-4 w-4" />
              <span>Uang Modal Tertahan di Barang Belum Laku</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ada uang modal sebesar{" "}
              <strong className="text-rose-600 dark:text-rose-300">
                {formatIDR(totalDeadstockCapital)}
              </strong>{" "}
              yang tertahan pada {deadstock.length} barang yang belum laku (contoh:{" "}
              <strong>{deadstock[0].name}</strong>).
            </p>
            <div className="text-xs text-foreground font-medium bg-background/80 dark:bg-background/40 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/60">
              <strong>Saran Aksi:</strong> Buat paket promo hemat atau berikan potongan harga di etalase toko agar barang terjual dan uang modal kembali berputar.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <TrendingUp className="h-4 w-4" />
              <span>Perputaran Barang Sangat Sehat</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tidak ada barang menumpuk yang menahan modal usaha. Semua barang terjual dengan baik.
            </p>
          </div>
        )}

        {/* Insight 2: Restock Prevention Recommendation */}
        {restockAlerts.length > 0 ? (
          <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Cegah Kehabisan Stok Barang</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Produk <strong>{restockAlerts[0].name}</strong> diperkirakan akan
              habis dalam{" "}
              <strong className="text-amber-700 dark:text-amber-300">
                {restockAlerts[0].daysOfStockLeft} hari ke depan
              </strong>{" "}
              (sisa {restockAlerts[0].currentStock} unit).
            </p>
            <div className="text-xs text-foreground font-medium bg-background/80 dark:bg-background/40 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
              <strong>Saran Aksi:</strong> Lakukan pemesanan ulang ke pemasok bahan baku sekarang untuk menghindari hilangnya potensi omzet kasir.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xs">
              <TrendingUp className="h-4 w-4" />
              <span>Stok Produk Masih Memadai</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Seluruh produk berada di atas batas aman stok minimum dan siap memenuhi permintaan transaksi harian.
            </p>
          </div>
        )}
      </div>

      {/* Margin Health Banner */}
      <div className="p-3.5 rounded-lg bg-muted/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
        <div>
          <span className="font-semibold text-foreground">
            Tingkat Margin Keuntungan Bersih: {profitMarginPercent}%
          </span>
          <span className="text-muted-foreground ml-2">
            {profitMarginPercent >= 20
              ? "(Kategori Sangat Sehat untuk standar UMKM Lokal)"
              : profitMarginPercent >= 10
              ? "(Cukup Baik, terus optimalkan pengeluaran bahan baku)"
              : "(Perlu Perhatian, beban operasional mendekati omzet kotor)"}
          </span>
        </div>
        <Link
          href="/dashboard/management/finance"
          className="text-amber-600 font-semibold hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Audit Buku Kas</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

