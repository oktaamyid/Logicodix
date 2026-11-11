import Link from "next/link";
import { Store, ShoppingBag, BarChart3, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Store className="h-6 w-6" />
            <span>Logicodix</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Eksplorasi UMKM
            </Link>
            <Link href="#pilar" className="hover:text-foreground transition-colors">
              Fitur Utama
            </Link>
            <Link href="#tim" className="hover:text-foreground transition-colors">
              Kolaborasi Tim
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5"
            >
              Masuk Toko
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1.5"
            >
              <span>Daftar UMKM</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 border-b">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Platform Mandiri Ekonomi Kreatif & UMKM Nusantara</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Satu Sistem Terpadu untuk <br className="hidden sm:inline" />
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                Operasional, Pasar, & Pembukuan
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tinggalkan catatan kertas dan aplikasi kasir terpisah. Logicodix menyinkronkan transaksi kasir harian, katalog toko online, hingga laporan laba-rugi otomatis tanpa rumus manual.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/explore"
                className="w-full sm:w-auto rounded-md bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Jelajahi Produk Lokal</span>
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Toko Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Pillars Section */}
        <section id="pilar" className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tiga Pilar Solusi Digital</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Dirancang spesifik untuk kebutuhan riil pelaku usaha mikro, kecil, dan kreator daerah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pilar 1 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 dark:bg-emerald-950 dark:text-emerald-300">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">1. Digitalisasi Operasional</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Smart POS kasir responsif untuk transaksi cepat, pencatatan Harga Pokok Penjualan (HPP), dan pengurangan stok otomatis secara atomik.
                </p>
                <div className="mt-4 pt-4 border-t text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  PIC: Developer 1 (@oktaamyid)
                </div>
              </div>

              {/* Pilar 2 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-4 dark:bg-blue-950 dark:text-blue-300">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">2. Akses Pasar Kreatif</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Katalog toko mikro instan (<code className="text-xs bg-muted px-1 py-0.5 rounded">/store/[slug]</code>), direktori ekonomi kreatif daerah, dan checkout langsung via WhatsApp.
                </p>
                <div className="mt-4 pt-4 border-t text-xs font-medium text-blue-700 dark:text-blue-400">
                  PIC: Developer 2 (@pompomv)
                </div>
              </div>

              {/* Pilar 3 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-4 dark:bg-amber-950 dark:text-amber-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">3. Optimasi Manajemen</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Buku kas keuangan otomatis, kalkulasi laba kotor & laba bersih, serta algoritma deteksi stok mengendap (*deadstock*) dan peringatan restock.
                </p>
                <div className="mt-4 pt-4 border-t text-xs font-medium text-amber-700 dark:text-amber-400">
                  PIC: Developer 3 (@wildanfarizy)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Collaboration Section */}
        <section id="tim" className="py-16 border-t">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Kolaborasi Tim & Arsitektur</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Dibangun oleh 3 Fullstack Developer dengan pembagian domain ketat bebas konflik kode:
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs font-mono">
              <a
                href="https://github.com/oktaamyid"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2.5 bg-card hover:bg-muted transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Dev 1: @oktaamyid (Lead & Operational)</span>
              </a>
              <a
                href="https://github.com/pompomv"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2.5 bg-card hover:bg-muted transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4 text-blue-500" />
                <span>Dev 2: @pompomv (Market Access)</span>
              </a>
              <a
                href="https://github.com/wildanfarizy"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2.5 bg-card hover:bg-muted transition-colors flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <span>Dev 3: @wildanfarizy (Business & Analytics)</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Logicodix — Digitalisasi UMKM & Ekonomi Kreatif Lokal.</p>
        </div>
      </footer>
    </div>
  );
}
