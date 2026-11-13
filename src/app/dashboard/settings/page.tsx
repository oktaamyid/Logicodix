import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getStoreSettingsDataAction } from "./actions";
import { StoreSettingsView } from "@/components/operational/StoreSettingsView";

export const metadata = {
  title: "Pengaturan Toko & Akun UMKM | Niagarupa",
  description:
    "Kelola profil etalase UMKM, nomor WhatsApp pesanan, dan akses tim operasional.",
};

async function StoreSettingsLoader() {
  const res = await getStoreSettingsDataAction();

  if (!res.success) {
    if (res.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    if (res.code === "NO_STORE") {
      redirect("/onboarding");
    }
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-950">
        <p className="font-semibold">Gagal memuat pengaturan toko</p>
        <p className="mt-1">{res.error}</p>
      </div>
    );
  }

  return <StoreSettingsView initialData={res.data} />;
}

export default function StoreSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-5xl animate-pulse">
          <div className="h-16 rounded-xl bg-slate-200/70" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="h-80 rounded-xl bg-slate-200/70 lg:col-span-5" />
            <div className="h-96 rounded-xl bg-slate-200/70 lg:col-span-7" />
          </div>
        </div>
      }
    >
      <StoreSettingsLoader />
    </Suspense>
  );
}
