import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/operational/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary justify-center">
            <Store className="h-6 w-6" />
            <span>Logicodix</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Masuk ke Toko Anda</h1>
          <p className="text-sm text-muted-foreground">
            Akses dashboard kasir POS, pesanan, dan pembukuan usaha.
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-muted-foreground">
          Belum punya akun toko?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar UMKM Baru
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
