import Link from "next/link";
import { Store, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Setup Toko Pertama Kali</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Lengkapi Profil Usaha Anda</h1>
          <p className="text-sm text-muted-foreground">
            Informasi toko akan ditampilkan pada katalog publik dan invoice pemesanan.
          </p>
        </div>

        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Form Wizard Profil Toko (Nama, Subsektor Kreatif, Kota, WhatsApp) — PIC: Developer 1 (@oktaamyid)
        </div>
      </div>
    </div>
  );
}
