import Link from "next/link";
import {
  Store,
  ArrowRight,
  ArrowUpRight,
  Receipt,
  PackageCheck,
  TrendingUp,
  ShoppingBag,
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
              href="#fitur-lengkap"
              className="hover:text-foreground transition-colors py-2"
            >
              Fitur Usaha
            </Link>
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors py-2"
            >
              Direktori Toko UMKM
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
              Daftar Toko
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section 1: Hero & Concrete Receipt-to-Ledger Breakdown */}
        <section className="border-b border-border py-12 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
              {/* Left Column: Clear Value Proposition */}
              <div className="lg:col-span-7 space-y-6 pt-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-[1.15]">
                  Aplikasi kasir, katalog pesanan WhatsApp, dan pembukuan untuk
                  toko UMKM.
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Catat penjualan di gerai fisik maupun pesanan dari pelanggan
                  online di satu tempat. Setiap transaksi langsung memotong sisa
                  stok gudang dan menghitung laba bersih setelah dikurangi harga
                  modal (HPP).
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <span>Buat Akun Toko Gratis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Telusuri Direktori UMKM</span>
                  </Link>
                </div>

                <div className="pt-2">
                  <Link
                    href="/store/kopi-seduh-nusantara"
                    className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>
                      Lihat contoh halaman katalog pelanggan: Kopi Seduh
                      Nusantara
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Key Operational Facts */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-border pt-8">
                  <div>
                    <dt className="text-xs font-semibold text-foreground">
                      Stok Terhubung Otomatis
                    </dt>
                    <dd className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Barang terjual di kasir atau katalog online otomatis
                      mengurangi jumlah stok di gudang.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-foreground">
                      Laba Akurat Berbasis HPP
                    </dt>
                    <dd className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Bukan sekadar omzet kotor. Sistem memisahkan harga modal
                      dari keuntungan bersih.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-foreground">
                      Pesanan Masuk ke WhatsApp
                    </dt>
                    <dd className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Pelanggan memilih barang di katalog web, lalu nota
                      pesanan dikirim ke nomor WhatsApp toko.
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Right Column: Clean Ledger & Receipt Preview */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Top Header */}
                  <div className="border-b border-border bg-secondary/50 px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Contoh Pencatatan Otomatis
                      </p>
                      <h2 className="text-sm font-bold text-foreground mt-0.5">
                        Kopi Seduh Nusantara, Bandung
                      </h2>
                    </div>
                    <span className="font-mono text-xs font-semibold text-foreground bg-background border border-border px-2.5 py-1 rounded">
                      #POS-042
                    </span>
                  </div>

                  {/* Receipt Items Table */}
                  <div className="p-5 space-y-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-2 font-semibold">Item Terjual</th>
                          <th className="pb-2 text-right font-semibold">
                            Stok
                          </th>
                          <th className="pb-2 text-right font-semibold">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        <tr>
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-foreground">
                              2x Arabika Gayo 250g
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Modal HPP: Rp 48.000/bks
                            </p>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-xs text-muted-foreground">
                            24 → 22
                          </td>
                          <td className="py-3 pl-2 text-right font-mono font-semibold text-foreground">
                            Rp 150.000
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-foreground">
                              1x Drip Bag Liberika
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Modal HPP: Rp 30.000/box
                            </p>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-xs text-muted-foreground">
                            15 → 14
                          </td>
                          <td className="py-3 pl-2 text-right font-semibold font-mono text-foreground">
                            Rp 55.000
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Financial Summary */}
                    <div className="border-t border-border pt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Penerimaan Kasir (QRIS)</span>
                        <span className="font-mono font-semibold text-foreground">
                          Rp 205.000
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Total Harga Modal (HPP)</span>
                        <span className="font-mono font-semibold text-foreground">
                          -Rp 126.000
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-950 border border-emerald-200">
                        <span>Laba Kotor Tersimpan</span>
                        <span className="font-mono">+Rp 79.000 (38,5%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Link */}
                  <div className="border-t border-border bg-secondary/30 px-5 py-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Tercatat langsung di Buku Kas
                    </span>
                    <Link
                      href="/dashboard/operational/pos"
                      className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Buka Kasir</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cara Kerja (3 Step Horizontal Flow) */}
        <section
          id="cara-kerja"
          className="border-b border-border bg-card py-14 sm:py-20"
        >
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Cara kerja dari pencatatan barang hingga laporan keuangan
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Tidak perlu menyalin catatan dari buku tulis ke spreadsheet.
                Tiga langkah berikut berjalan saling terhubung.
              </p>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-y-0 lg:divide-x border border-border rounded-xl bg-background">
              {/* Step 1 */}
              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    LANGKAH 01
                  </span>
                  <PackageCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Masukkan Produk & Harga Modal
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Catat nama produk, kode SKU, harga pokok (HPP), harga jual,
                  dan batas stok minimum. Sistem langsung menampilkan persentase
                  margin keuntungan setiap barang.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    LANGKAH 02
                  </span>
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Terima Transaksi Kasir & Online
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gunakan layar kasir (POS) untuk melayani pembeli di toko, atau
                  bagikan tautan katalog online Anda di WhatsApp dan Instagram
                  untuk menerima pesanan jarak jauh.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    LANGKAH 03
                  </span>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Evaluasi Laba Bersih & Stok
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Catat pengeluaran operasional seperti listrik, sewa, dan bahan
                  baku. Pantau laba bersih, target titik impas (BEP), serta
                  daftar barang yang lama tidak terjual.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Detailed Capabilities (Editorial Split List) */}
        <section id="fitur-lengkap" className="py-14 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left Sticky Header */}
              <div className="lg:col-span-4 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Fitur lengkap untuk operasional harian toko
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seluruh modul dapat diakses dari laptop kasir maupun ponsel
                  pemilik toko, lengkap dengan pembagian hak akses untuk staf
                  dan kasir.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard/operational/pos"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Buka Dashboard Toko</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right Divided Feature Rows */}
              <div className="lg:col-span-8 divide-y divide-border border-t border-b border-border">
                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <h3 className="text-base font-bold text-foreground">
                      Kasir POS & Struk Digital
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transaksi cepat di gerai fisik
                    </p>
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Cari barang berdasarkan nama atau kategori, tambahkan
                      potongan diskon transaksi, pilih metode bayar (Tunai,
                      QRIS, Transfer Bank), dan cetak struk belanja pelanggan.
                    </p>
                    <Link
                      href="/dashboard/operational/pos"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Lihat Terminal Kasir</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <h3 className="text-base font-bold text-foreground">
                      Katalog Online & Kupon Diskon
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Etalase resmi terhubung WhatsApp
                    </p>
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Setiap usaha mendapatkan alamat halaman katalog tersendiri.
                      Pembeli dapat memilih barang, memakai kode kupon promo
                      toko, dan meneruskan pesanan langsung ke WhatsApp Anda.
                    </p>
                    <Link
                      href="/store/kopi-seduh-nusantara"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Lihat Contoh Katalog Toko</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <h3 className="text-base font-bold text-foreground">
                      Audit Stok & Stok Opname
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kendali keluar-masuk barang gudang
                    </p>
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Rekam penambahan stok baru (restock), penyesuaian stok
                      opname fisik, maupun pencatatan barang rusak. Seluruh
                      riwayat perubahan jumlah barang tercatat beserta waktunya.
                    </p>
                    <Link
                      href="/dashboard/operational/inventory"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Lihat Riwayat Mutasi Stok</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <h3 className="text-base font-bold text-foreground">
                      Buku Kas, Laba Rugi & BEP
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Laporan keuangan siap unduh
                    </p>
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Rekapitulasi pemasukan penjualan dan pengeluaran biaya
                      usaha berdasarkan rentang tanggal. Dilengkapi perhitungan
                      titik impas (Break-Even Point), deteksi modal tertahan
                      pada stok mengendap, serta unduh laporan CSV/PDF.
                    </p>
                    <Link
                      href="/dashboard/management/finance"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Lihat Buku Kas & Laba Rugi</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Dual Action Footer Band */}
        <section className="border-t border-border bg-slate-900 text-white py-12 sm:py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Mulai rapikan pencatatan toko Anda hari ini
                </h2>
                <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
                  Daftar akun baru untuk membuka toko UMKM Anda, atau jelajahi
                  produk dari pelaku usaha lokal yang telah bergabung.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:justify-end gap-3">
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
                  <span>Belanja Produk Lokal</span>
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
            <span>Niagarupa</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
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
