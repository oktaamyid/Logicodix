import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getPlatformAdminOverviewAction } from "./actions";
import { PlatformAdminView } from "@/components/operational/PlatformAdminView";

export const metadata = {
  title: "Panel Kendali Ekosistem UMKM | Niagarupa",
  description:
    "Panel administrasi platform untuk pemantauan tenant UMKM dan kurasi direktori.",
};

async function PlatformAdminLoader() {
  const res = await getPlatformAdminOverviewAction();

  if (!res.success) {
    if (res.code === "UNAUTHENTICATED") {
      redirect("/login");
    }

    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-8 text-amber-950 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-amber-800 shrink-0" />
          <h1 className="text-lg font-bold">Akses Terbatas Admin Platform</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{res.error}</p>
        <div className="mt-6">
          <Link
            href="/dashboard/operational/pos"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Kasir Operasional</span>
          </Link>
        </div>
      </div>
    );
  }

  return <PlatformAdminView initialData={res.data} />;
}

export default function PlatformAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-6xl animate-pulse">
          <div className="h-20 rounded-xl bg-slate-200/70" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="h-36 rounded-xl bg-slate-200/70 lg:col-span-5" />
            <div className="h-36 rounded-xl bg-slate-200/70 lg:col-span-7" />
          </div>
          <div className="h-80 rounded-xl bg-slate-200/70" />
        </div>
      }
    >
      <PlatformAdminLoader />
    </Suspense>
  );
}
