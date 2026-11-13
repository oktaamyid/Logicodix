import Link from "next/link";
import {
  Store,
  ShoppingCart,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Calculator,
} from "lucide-react";

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
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Niagarupa
              </span>
              <span className="ml-2 hidden rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 sm:inline-block">
                UMKM & Ekonomi Kreatif
              </span>
            </div>
          </Link>

          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground"
          >
            <Link
              href="#modul-utama"
              className="hover:text-foreground transition-colors py-2"
            >
              Alur Kerja Terpadu
            </Link>
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors py-2"
            >
              Direktori UMKM Lokal
            </Link>
            <Link
              href="/store/kopi-seduh-nusantara"
              className="hover:text-foreground transition-colors py-2"
            >
              Contoh Etalase Toko
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Masuk Akun
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Buka Toko Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Asymmetric Split Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-secondary/50 to-background py-14 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Value Proposition & Specific CTAs */}
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Karya Berdaya, Niaga Tertata
                </p>

                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-[1.12]">
                  Satu meja kerja untuk kasir fisik, katalog WhatsApp, dan buku
                  kas UMKM.
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Banyak pelaku usaha kriya, kuliner, dan kopi lokal kehilangan
                  margin karena stok gudang, pesanan online, dan pencatatan
                  modal berjalan terpisah. Niagarupa menyatukan ketiganya dalam
                  satu alur transaksi otomatis.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <span>Daftarkan Usaha Anda</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                    <span>Telusuri Katalog UMKM</span>
                  </Link>
                </div>

                <dl className="grid grid-cols-3 gap-4 border-t border-border pt-6 text-left">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Potong Stok Otomatis
                    </dt>
                    <dd className="mt-0.5 font-mono text-lg font-bold text-foreground">
                      Real-time
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Perhitungan Laba
                    </dt>
                    <dd className="mt-0.5 font-mono text-lg font-bold text-foreground">
                      Basis HPP
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Jalur Pesanan
                    </dt>
                    <dd className="mt-0.5 font-mono text-lg font-bold text-foreground">
                      POS & WA
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Right Column: Live Ledger Simulation Preview */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Simulasi Transaksi Terintegrasi
                      </span>
                      <h2 className="text-base font-bold text-foreground mt-0.5">
                        Kopi Seduh Nusantara • Bandung
                      </h2>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-900">
                      #ORD-POS-042
                    </span>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          2x Kopi Arabika Gayo 250g
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          HPP Rp 48.000/bks • Stok: 24 → 22 bks
                        </p>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        Rp 150.000
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          1x Drip Bag Liberika Meranti
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          HPP Rp 30.000/box • Stok: 15 → 14 box
                        </p>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        Rp 55.000
                      </span>
                    </div>
                  </div>

                  {/* Automatic Accounting Breakdown */}
                  <div className="rounded-xl border border-emerald-900/15 bg-emerald-50/70 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Total Penerimaan Kas (QRIS)</span>
                      <span className="font-mono font-semibold text-slate-900">
                        Rp 205.000
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Beban Pokok Penjualan (HPP Tercatat)</span>
                      <span className="font-mono font-semibold text-slate-900">
                        (Rp 126.000)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-emerald-900/15 pt-2 text-sm font-bold text-emerald-950">
                      <span>Laba Kotor Transaksi Ini (38,5%)</span>
                      <span className="font-mono">Rp 79.000</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Otomatis masuk ke Buku Kas & Laporan Laba Rugi</span>
                    <Link
                      href="/dashboard/operational/pos"
                      className="font-semibold text-primary hover:underline"
                    >
                      Buka Kasir →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Varied Hierarchy Feature Architecture (1 Flagship Row + 2 Split Blocks) */}
        <section id="modul-utama" className="py-16 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Arsitektur Tiga Pilar Niagarupa
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Dirancang mengikuti ritme kerja harian pemilik toko dan perajin
                lokal.
              </h2>
            </div>

            {/* Pillar 1: Flagship Full-Width Horizontal Module */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Pilar 01 • Operasional & Inventori</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    Terminal Kasir POS, Katalog HPP, dan Audit Mutasi Gudang
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Catat penjualan tunai, QRIS, maupun transfer bank dalam
                    hitungan detik. Setiap produk menyimpan Harga Pokok
                    Penjualan (HPP) dan ambang batas stok minimum sehingga
                    peringatan barang menipis muncul sebelum rak Anda kosong.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/operational/pos"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Masuk ke Terminal Kasir</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Kalkulasi Margin Produk Otomatis</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bandingkan harga modal dengan harga jual langsung saat
                      mendaftarkan SKU baru.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Riwayat Stok Opname & Barang Rusak</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Setiap koreksi stok fisik tercatat beserta alasan dan
                      waktu perubahan untuk mencegah selisih barang.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2 & Pillar 3: Asymmetric 5/7 Split Row */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Pillar 2 */}
              <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Pilar 02 • Etalase & Akses Pasar</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Katalog Publik, Kupon Diskon, dan Checkout WhatsApp
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Setiap toko memiliki tautan etalase khusus yang dapat
                    dibagikan di media sosial. Pelanggan memilih produk,
                    memasukkan kode kupon promo, dan mengirimkan rincian
                    pesanan terformat langsung ke WhatsApp kasir Anda.
                  </p>
                </div>

                <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/explore"
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    <span>Buka Direktori UMKM</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/store/kopi-seduh-nusantara"
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    Lihat Demo Toko
                  </Link>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Pilar 03 • Keuangan & Analitik Usaha</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Buku Kas Laba Rugi, Analisis Titik Impas (BEP), dan Deteksi
                    Stok Mengendap
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pantau laba bersih setelah dikurangi HPP dan beban
                    operasional bulanan (sewa, listrik, gaji, bahan baku).
                    Identifikasi produk terlaris maupun modal yang tertahan
                    pada stok tidak bergerak lebih dari 30 hari, lengkap dengan
                    ekspor laporan CSV dan cetak PDF.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <Calculator className="h-4 w-4 text-primary shrink-0" />
                    <span>Simulasi target omzet titik impas (BEP)</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      href="/dashboard/management/overview"
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>Buka Laporan Keuangan</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Store className="h-4 w-4 text-primary" />
            <span>Niagarupa: Karya Berdaya, Niaga Tertata</span>
          </div>
          <p>
            Platform Digitalisasi Operasional, Akses Pasar, dan Pembukuan UMKM
            Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}
