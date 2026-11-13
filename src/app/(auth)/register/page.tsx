import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import { RegisterForm } from "@/components/operational/RegisterForm";

export const metadata = {
  title: "Daftar Akun Merchant | Niagarupa",
  description: "Mulai digitalisasi operasional, kasir POS, dan pembukuan UMKM Anda.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 font-bold text-xl text-primary justify-center"
          >
            <Store className="h-6 w-6" />
            <span className="text-foreground">Niagarupa</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Akun Merchant
          </h1>
          <p className="text-sm text-muted-foreground">
            Mulai digitalisasi usaha UMKM dan ekonomi kreatif Anda.
          </p>
        </div>

        <RegisterForm />

        <div className="text-center text-sm text-muted-foreground">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Masuk Sekarang
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
