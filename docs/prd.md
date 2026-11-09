# Product Requirements Document (PRD)
## Project: Logicodix — Local MSME & Creative Economy Hub

| Metadata | Detail |
| :--- | :--- |
| **Nama Produk** | **Logicodix** (Platform All-in-One UMKM & Ekonomi Kreatif Lokal) |
| **Tema** | Local MSME & Creative Economy: Digitalisasi Operasional, Akses Pasar, & Optimasi Manajemen Bisnis |
| **Tim Pengembang** | 3 Fullstack Developers (Domain-Driven Split) |
| **Tech Stack** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL, Auth, Storage), Drizzle ORM, Zod |
| **Status Dokumen** | v1.0.0 — Phase 0 (Initiation) |

---

## 1. Latar Belakang & Masalah Utama (Problem Statement)

Pelaku UMKM (Usaha Mikro, Kecil, dan Menengah) serta pelaku Ekonomi Kreatif lokal menghadapi 3 hambatan struktural utama dalam melakukan transformasi digital:

1. **Operasional yang Terfragmentasi & Manual**: Pencatatan transaksi harian (kasir), stok bahan baku/produk, dan arus kas masih dilakukan manual atau tersebar di aplikasi terpisah yang tidak saling sinkron.
2. **Keterbatasan Akses Pasar Digital**: Banyak UMKM lokal kesulitan membuat etalase digital profesional yang terhubung otomatis dengan ketersediaan stok aktual mereka, serta kurang terekspos di direktori ekonomi kreatif daerah.
3. **Minimnya Visibilitas & Optimasi Manajemen Bisnis**: Pemilik usaha kesulitan mengetahui produk paling menguntungkan (margin tertinggi), prediksi stok habis (*deadstock* vs *fast-moving*), serta laporan laba-rugi instan untuk pengambilan keputusan bisnis.

---

## 2. Solusi Produk (Product Vision)

**Logicodix** adalah platform SaaS & Direktori Terpadu (*All-in-One UMKM Hub*) yang menghubungkan **3 pilar utama** dalam satu ekosistem real-time:

1. **Pilar 1 — Digitalisasi Operasional (Smart POS & Inventory)**: Sistem Kasir (Point of Sale) responsif dan manajemen inventori otomatis (produk, varian, stok, pengingat stok menipis, & riwayat mutasi).
2. **Pilar 2 — Akses Pasar (Digital Storefront & Local Creative Directory)**: Pembuatan halaman katalog toko mikro (*micro-storefront* `logicodix.id/toko/[slug]`) otomatis dari data inventori, terintegrasi dengan Direktori Pasar Kreatif Lokal, keranjang belanja, dan checkout langsung (WhatsApp Order / Payment Link).
3. **Pilar 3 — Optimasi Manajemen Bisnis (Financial Ledger & Business Intelligence)**: Pencatatan keuangan otomatis dari transaksi POS & online, manajemen beban operasional (pengeluaran), metrik kesehatan bisnis, produk terlaris, dan rekomendasi optimasi stok/harga.

---

## 3. Target Pengguna (User Personas)

| Persona | Deskripsi | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Pemilik UMKM / Kreator Lokal (Merchant Owner)** | Pemilik kedai kopi, kriya/kerajinan tangan, kuliner, fashion lokal, atau jasa kreatif. | Memantau omzet harian, mengatur katalog toko, melihat laporan laba-rugi, dan insight bisnis. |
| **Staf / Kasir UMKM (Merchant Staff)** | Karyawan toko yang bertugas melayani pelanggan di lokasi fisik maupun memproses pesanan online. | Menginput transaksi kasir (POS) dengan cepat, memperbarui stok, dan mengubah status pesanan. |
| **Pembeli / Eksplorer Lokal (Public Buyer)** | Masyarakat lokal atau wisatawan yang mencari produk UMKM & ekonomi kreatif daerah. | Menjelajahi direktori UMKM berdasarkan kategori/lokasi, melihat katalog produk real-time, dan memesan dengan mudah. |

---

## 4. Lingkup Fitur (Feature Specifications & MoSCoW Prioritization)

### Domain A: Core Auth, Multi-Store Onboarding & Operational (POS + Inventory)
*PIC: Developer 1 (Operational & Core Domain)*

- **[MUST] Multi-Role Authentication & Onboarding UMKM**:
  - Registrasi & Login via Supabase Auth (Email/Password & Google OAuth).
  - Setup profil toko UMKM (Nama usaha, kategori ekonomi kreatif, alamat/kota, nomor WhatsApp, logo, jam operasional).
- **[MUST] Manajemen Produk & Inventori**:
  - CRUD produk lengkap dengan SKU, harga modal (HPP), harga jual, stok saat ini, batas minimum stok (*low-stock threshold*), foto produk (Supabase Storage), dan status tampil di katalog publik.
  - Pencatatan mutasi stok (*stock movement*: Barang Masuk, Penjualan, Barang Rusak/Penyesuaian).
- **[MUST] Sistem Kasir Digital (Smart POS)**:
  - Antarmuka kasir cepat dengan pencarian produk, filter kategori, keranjang transaksi, diskon, dan pilihan metode pembayaran (Tunai, QRIS, Transfer).
  - Pemotongan stok otomatis saat transaksi selesai dan pembuatan struk digital.

### Domain B: Market Access, Storefront & Order Management
*PIC: Developer 2 (Market Access & Storefront Domain)*

- **[MUST] Direktori Ekonomi Kreatif & Marketplace Lokal (`/explore`)**:
  - Halaman publik untuk menjelajahi UMKM lokal berdasarkan sektor ekonomi kreatif (Kuliner, Kriya, Fashion, Seni Pertunjukan, Desain, dll.) dan lokasi.
  - Pencarian produk lintas UMKM dan fitur penyaringan harga/kategori.
- **[MUST] Micro-Storefront UMKM (`/store/[slug]`)**:
  - Halaman etalase digital instan untuk setiap UMKM yang tersinkronisasi real-time dengan stok inventori.
  - Keranjang belanja pelanggan tanpa wajib login (*guest checkout friendly*).
- **[MUST] Manajemen Pesanan Terpadu (Omnichannel Order Pipeline)**:
  - Checkout pesanan publik yang tercatat ke sistem UMKM sekaligus mengarahkan konfirmasi ke WhatsApp penjual / instruksi pembayaran.
  - Dashboard pesanan masuk (`Pending` → `Confirmed` → `Processing` → `Completed` / `Cancelled`) yang otomatis memotong stok dan mencatat pemasukan saat selesai.
- **[SHOULD] Ulasan & Voucher Promo Lokal**:
  - Kode kupon diskon toko dan rating ulasan pelanggan untuk meningkatkan kepercayaan pasar.

### Domain C: Business Management Optimization, Finance & Analytics
*PIC: Developer 3 (Business Intelligence & Finance Domain)*

- **[MUST] Pembukuan Keuangan & Arus Kas (Financial Ledger)**:
  - Pencatatan pemasukan otomatis dari transaksi POS dan pesanan online.
  - Pencatatan pengeluaran operasional manual (pembelian bahan baku, sewa, gaji, listrik, pemasaran).
  - Kalkulasi Laba Kotor (*Gross Profit* dari Harga Jual dikurangi HPP) dan Laba Bersih (*Net Profit* dikurangi beban operasional).
- **[MUST] Dashboard Analitik & Optimasi Bisnis**:
  - Visualisasi tren penjualan (harian, mingguan, bulanan), rata-rata nilai transaksi (*Average Order Value*), dan margin keuntungan.
  - Klasifikasi performa produk: *Fast-Moving* (laris), *High-Margin* (menguntungkan), dan *Deadstock* (stok mengendap).
- **[MUST] Rekomendasi Bisnis Cerdas (Business Health Insights)**:
  - Peringatan restock otomatis berdasarkan laju penjualan harian (*burn rate* stok).
  - Ringkasan rekomendasi aksi (contoh: bundel promosi untuk produk *deadstock*, evaluasi margin produk).
- **[SHOULD] Ekspor Laporan Bisnis**:
  - Unduh laporan penjualan dan pembukuan bulanan dalam format CSV / Cetak PDF.

---

## 5. User Flows Utama

1. **Alur Digitalisasi UMKM Baru**:
   `Sign Up` → `Onboarding Wizard (Buat Toko UMKM)` → `Tambah Produk + HPP + Stok` → `Toko Publik Aktif & Siap Transaksi POS`.
2. **Alur Transaksi Kasir (Offline/In-Store)**:
   `Buka Menu POS` → `Pilih Produk ke Keranjang` → `Pilih Metode Bayar (Tunai/QRIS)` → `Submit Server Action` → `Stok Berkurang + Jurnal Keuangan Tercatat + Struk Digital`.
3. **Alur Akses Pasar (Online Buyer)**:
   `Buka /explore atau /store/[slug]` → `Pilih Produk UMKM` → `Isi Data Pemesan & Checkout` → `Order Tercatat di Dashboard UMKM + Redirect Konfirmasi WhatsApp` → `UMKM Konfirmasi Bayar` → `Stok & Keuangan Terupdate`.
4. **Alur Optimasi Manajemen**:
   `Buka Dashboard Analitik & Keuangan` → `Catat Beban Operasional` → `Lihat Laba Bersih & Peringatan Stok/Deadstock` → `Ambil Keputusan Restock / Promo`.

---

## 6. Acceptance Criteria & Non-Functional Requirements

- **Performa**:
  - Bundle size halaman utama < 200KB.
  - Largest Contentful Paint (LCP) < 2.5 detik, Cumulative Layout Shift (CLS) < 0.1.
- **Keamanan Data**:
  - Multi-tenancy aman: Setiap UMKM hanya bisa mengakses dan memodifikasi data tokonya sendiri menggunakan **Supabase Row Level Security (RLS)** dan validasi kepemilikan di Server Actions.
  - Seluruh input form dan parameter divalidasi dengan **Zod** di sisi server.
- **Responsivitas**:
  - Desain *mobile-first* karena mayoritas pemilik UMKM di Indonesia mengakses sistem melalui smartphone atau tablet kasir.
