import Link from "next/link";
import { Store, Sparkles } from "lucide-react";
import { OnboardingForm } from "@/components/operational/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-xl rounded-xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary justify-center">
            <Store className="h-6 w-6" />
            <span>Logicodix</span>
          </Link>
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Setup Toko Pertama Kali</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lengkapi Profil Usaha Anda</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Profil ini akan menjadi identitas toko Anda di kasir POS dan etalase online publik.
            </p>
          </div>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
