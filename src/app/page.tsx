import Link from "next/link";
import Image from "next/image";
import {
  Store,
  ArrowRight,
  Play,
  ShoppingBag,
  ScanBarcode,
  Receipt,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { HomeDemoShowcase } from "@/components/market/HomeDemoShowcase";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Niagarupa
            </span>
          </Link>

          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground"
          >
            <Link
              href="#cara-kerja"
              className="hover:text-foreground transition-colors py-2"
            >
              Cara Kerja
            </Link>
            <Link
              href="#demo"
              className="hover:text-foreground transition-colors py-2"
            >
              Coba Demo
            </Link>
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors py-2"
            >
              Direktori UMKM
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Buka Toko
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section 1: Visual-First Hero */}
        <section className="border-b border-border py-10 sm:py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left: Concise Value Proposition */}
              <div className="lg:col-span-6 space-y-5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-[1.12]">
                  Kasir, katalog WhatsApp, dan pembukuan untuk toko UMKM.
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Kelola penjualan toko fisik dan pesanan online dalam satu layar.
                  Stok terpotong otomatis dan laba bersih langsung terhitung.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <span>Buat Toko Gratis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#demo"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Play className="h-4 w-4 text-emerald-700" />
                    <span>Coba Demo Langsung</span>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    Scan barcode kamera
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    Akun kasir & staf terpisah
                  </span>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>Jelajahi Direktori UMKM</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Right: Hero Visual Asset */}
              <div className="lg:col-span-6">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-md">
                  <Image
                    src="/images/hero-umkm.jpg"
                    alt="Ilustrasi meja kasir toko UMKM menggunakan sistem POS Niagarupa dan pemindai barcode"
                    width={1200}
                    height={900}
                    priority
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cara Kerja dengan Tampilan Visual Ringkas */}
        <section
          id="cara-kerja"
          className="border-b border-border bg-card py-12 sm:py-16"
        >
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Cara kerja dalam 3 langkah
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dari input barang sampai laporan untung rugi berjalan otomatis.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 Visual Card */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground">
                      SKU: 89910021
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800">
                      <ScanBarcode className="h-3 w-3" /> Scan
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Arabika Gayo 250g
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border">
                    <span className="text-muted-foreground">Modal: Rp 48rb</span>
                    <span className="font-bold text-emerald-700">
                      Jual: Rp 75rb
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    01. DATA PRODUK
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    Input Barang & Scan Barcode
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Masukkan foto, harga modal, dan harga jual, atau scan langsung
                    dari kamera.
                  </p>
                </div>
              </div>

              {/* Step 2 Visual Card */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Receipt className="h-3 w-3 text-emerald-700" /> Kasir POS
                    </span>
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Tunai / QRIS
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">2x Arabika Gayo</span>
                    <span className="font-mono font-bold text-foreground">
                      Rp 150.000
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border text-emerald-800 font-semibold">
                    <span>Kembalian: Rp 0</span>
                    <span>Struk Siap</span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    02. TRANSAKSI
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    Layani Kasir & Order WhatsApp
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Proses transaksi di gerai fisik atau terima pesanan dari link
                    katalog toko.
                  </p>
                </div>
              </div>

              {/* Step 3 Visual Card */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-700" /> Buku Kas
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Stok: 24 → 22
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Untung Bersih</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +Rp 54.000
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                    <div className="h-full w-2/3 bg-emerald-600 rounded-full" />
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    03. LAPORAN
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    Pantau Stok & Untung Bersih
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Stok berkurang otomatis dan laba bersih langsung terlihat
                    tanpa hitung manual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Live Demo & Feature Preview */}
        <section id="demo" className="py-12 sm:py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Coba demo interaktif & lihat tampilannya
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Klik produk, simulasikan scan barcode, atau lihat tampilan
                  katalog dan laporan di bawah ini.
                </p>
              </div>
              <Link
                href="/store/kopi-seduh-nusantara"
                className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
              >
                <span>Buka Toko Demo: Kopi Seduh Nusantara</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <HomeDemoShowcase />
          </div>
        </section>

        {/* Section 4: Compact CTA Footer Band */}
        <section className="border-t border-border bg-slate-900 text-white py-10 sm:py-14">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Siap merapikan kasir dan pembukuan toko Anda?
                </h2>
                <p className="text-sm text-slate-300">
                  Gratis untuk UMKM. Langsung aktif dalam hitungan menit.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/register"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  <span>Daftarkan Toko UMKM</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  <span>Direktori UMKM</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Store className="h-4 w-4 text-primary" />
            Niagarupa <span className="text-gray-700">&copy; {new Date().getFullYear()}. Biar gak kena SP Group.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="#demo" className="hover:text-foreground">
              Demo Sistem
            </Link>
            <Link href="/explore" className="hover:text-foreground">
              Direktori Toko
            </Link>
            <Link
              href="/store/kopi-seduh-nusantara"
              className="hover:text-foreground"
            >
              Contoh Katalog
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Masuk Akun
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
