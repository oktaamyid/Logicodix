"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Store,
  Package,
  ShoppingBag,
  Wallet,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  toggleStoreActiveAdminAction,
  type PlatformAdminOverview,
} from "@/app/dashboard/admin/actions";

interface PlatformAdminViewProps {
  initialData: PlatformAdminOverview;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PlatformAdminView({ initialData }: PlatformAdminViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const filteredStores = initialData.stores.filter((store) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.subsector.toLowerCase().includes(q) ||
      store.slug.toLowerCase().includes(q)
    );
  });

  function handleToggleStore(storeId: string, nextStatus: boolean, name: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleStoreActiveAdminAction({
        storeId,
        isActive: nextStatus,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: `Status etalase "${name}" berhasil diubah menjadi ${
          nextStatus ? "Aktif" : "Nonaktif"
        }.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Otoritas Superadmin Platform ({initialData.adminEmail})</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel Kendali Ekosistem UMKM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau pertumbuhan tenant UMKM terdaftar, volume transaksi lintas
            toko, dan kurasi visibilitas direktori publik.
          </p>
        </div>

        <Link
          href="/explore"
          target="_blank"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
        >
          <span>Buka Direktori Publik</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950"
              : "border-red-300 bg-red-50 text-red-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700 mt-0.5" />
          )}
          <div className="font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Asymmetric Metric Strip: Primary GMV Hero + 3 Operational Counters */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-emerald-900/20 bg-slate-900 p-6 text-white shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Total Perputaran Ekonomi (GMV Selesai)
            </span>
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="my-4">
            <p className="font-mono text-3xl font-bold tracking-tight text-white">
              {formatRupiah(initialData.totalEcosystemGmv)}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Akumulasi seluruh pesanan berstatus selesai dari kasir POS dan
              etalase online
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tenant UMKM</span>
              <Store className="h-4 w-4 text-emerald-800" />
            </div>
            <div className="mt-4">
              <p className="font-mono text-2xl font-bold text-foreground">
                {initialData.totalStores}
              </p>
              <p className="mt-1 text-xs text-emerald-800 font-medium">
                {initialData.activeStores} etalase aktif
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Katalog Produk</span>
              <Package className="h-4 w-4 text-emerald-800" />
            </div>
            <div className="mt-4">
              <p className="font-mono text-2xl font-bold text-foreground">
                {initialData.totalProducts}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                SKU terdaftar di sistem
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Transaksi Selesai</span>
              <ShoppingBag className="h-4 w-4 text-emerald-800" />
            </div>
            <div className="mt-4">
              <p className="font-mono text-2xl font-bold text-foreground">
                {initialData.totalCompletedOrders}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pesanan lunas tercatat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Moderation Table */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Daftar Mitra UMKM & Kurasi Direktori ({filteredStores.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Kelola status tayang setiap toko pada halaman Eksplorasi Pasar
              Kreatif
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Cari nama toko, kota, atau subsektor"
              placeholder="Cari nama toko atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-input bg-background pl-9 pr-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Identitas Toko</th>
                <th className="px-5 py-3.5">Subsektor & Kota</th>
                <th className="px-5 py-3.5 text-right">Produk</th>
                <th className="px-5 py-3.5 text-right">Pesanan Lunas</th>
                <th className="px-5 py-3.5 text-right">Omzet Tercatat</th>
                <th className="px-5 py-3.5">Status Direktori</th>
                <th className="px-5 py-3.5 text-right">Tindakan Kurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStores.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada toko UMKM yang cocok dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredStores.map((st) => (
                  <tr
                    key={st.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">
                        {st.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>/store/{st.slug}</span>
                        <Link
                          href={`/store/${st.slug}`}
                          target="_blank"
                          aria-label={`Buka etalase ${st.name}`}
                          className="text-emerald-800 hover:underline inline-flex items-center gap-0.5 font-sans font-medium"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold capitalize text-foreground">
                        {st.subsector.replace(/_/g, " ")}
                      </span>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {st.city} • WA: {st.whatsappNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium text-foreground">
                      {st.productCount}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium text-foreground">
                      {st.completedOrderCount}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-foreground">
                      {formatRupiah(st.gmvAmount)}
                    </td>
                    <td className="px-5 py-4">
                      {st.isActive ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                          Tayang Publik
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">
                          Ditangguhkan
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleToggleStore(st.id, !st.isActive, st.name)
                        }
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          st.isActive
                            ? "border border-border bg-white text-foreground hover:bg-secondary"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {st.isActive ? "Nonaktifkan Etalase" : "Aktifkan Etalase"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
