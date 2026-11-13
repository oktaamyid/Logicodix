import Link from "next/link";
import { Store } from "lucide-react";
import { OnboardingForm } from "@/components/operational/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 font-bold text-xl text-primary justify-center"
          >
            <Store className="h-6 w-6" />
            <span className="text-foreground">Niagarupa</span>
          </Link>
          <div className="pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lengkapi Profil Usaha Anda
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Profil ini digunakan sebagai identitas resmi toko Anda pada struk
              kasir POS dan etalase publik.
            </p>
          </div>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
