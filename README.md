# Niagarupa - Platform Digitalisasi UMKM & Ekonomi Kreatif Lokal

> **Event**: Logicodix | **Tagline**: *Karya Berdaya, Niaga Tertata*

**Niagarupa** adalah platform *All-in-One* berbasis Next.js App Router, Supabase, dan Drizzle ORM untuk membantu pelaku UMKM lokal mengelola kasir toko, stok gudang, katalog pesanan WhatsApp, hingga pembukuan laba rugi secara terpadu.

---

## 1. Fitur Utama

### Operasional & Stok (`src/app/dashboard/operational/`)
- **Kasir Toko (Smart POS)** (`/dashboard/operational/pos`): Transaksi cepat Tunai/QRIS/Transfer, pecahan uang cepat, perhitungan kembalian otomatis, diskon nominal (`Rp`) atau persen (`%`), tahan transaksi (antrean struk), cetak struk thermal, serta shortcut keyboard (`F2`, `F4`, `Esc`).
- **Scan Barcode & QR Kamera** (`html5-qrcode`): Pemindaian barcode kemasan (EAN-13, EAN-8, Code-128, UPC, QR) langsung dari kamera HP/laptop di kasir maupun saat mendaftarkan SKU produk, ditambah dukungan scanner USB.
- **Katalog Produk & Modal** (`/dashboard/operational/products`): Pengelolaan produk, satuan barang standar & kustom, kalkulator margin laba kotor berbasis HPP, unggah foto produk ke Supabase Storage, serta asisten rekomendasi harga & deskripsi produk otomatis.
- **Catatan Stok Gudang** (`/dashboard/operational/inventory`): Pencatatan restock, stok opname fisik, dan barang rusak lengkap dengan audit trail waktu dan alasan mutasi.

### Etalase Publik & Pesanan (`src/app/(market)/` & `src/app/dashboard/orders/`)
- **Direktori UMKM Lokal** (`/explore`): Pencarian toko UMKM berdasarkan kata kunci, kota/kabupaten, dan subsektor ekonomi kreatif.
- **Micro-Storefront Toko** (`/store/[slug]`): Halaman etalase resmi setiap toko lengkap dengan logo, banner, katalog produk, kupon diskon toko, keranjang belanja, dan checkout langsung ke WhatsApp pemilik usaha.
- **Pesanan Masuk & Kupon** (`/dashboard/orders`, `/dashboard/orders/vouchers`): Pemantauan pesanan dari etalase online dan pengelolaan kode kupon promo.

### Keuangan, Laporan & AI In-App (`src/app/dashboard/management/` & `src/lib/ai/`)
- **Ringkasan Usaha & Buku Kas** (`/dashboard/management/overview`, `/dashboard/management/finance`): Pencatatan pemasukan otomatis dari POS/Order dan pengeluaran operasional, perhitungan Laba Kotor, Laba Bersih, dan ekspor CSV/Print.
- **Laporan Penjualan & Kesehatan Stok** (`/dashboard/management/analytics`): Kalkulasi Target Balik Modal (BEP), deteksi produk terlaris vs stok mengendap, serta proyeksi penjualan & skor kesehatan SKU berbasis *In-App Machine Learning* (TypeScript murni, tanpa server Python terpisah).

### Multi-Role, Tim Toko & Panel Admin Platform
- **Pengaturan Toko & Tim** (`/dashboard/settings`): Unggah Logo Toko & Banner Etalase ke Supabase Storage, pratinjau nota belanja langsung, serta manajemen karyawan (**Tambah Karyawan** via email terdaftar, ubah peran **Kasir POS** / **Staf Gudang**, atau hapus akses).
- **Panel Admin Platform** (`/dashboard/admin`): Akun Administrator Platform terpisah dari onboarding UMKM (dilengkapi switcher **Mode Admin** / **Pemilik Toko**), pemantauan GMV lintas toko, sebaran subsektor, kurasi status tayang direktori, kontak WhatsApp mitra, dan ekspor CSV mitra.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, Server Components & Server Actions)
- **Language**: TypeScript (`strict: true`)
- **Database & Auth & Storage**: Supabase (PostgreSQL, `@supabase/ssr`, Google OAuth, Supabase Storage bucket `niagarupa-media`)
- **ORM & Migrations**: Drizzle ORM + `drizzle-kit`
- **Validation**: Zod (`src/lib/schemas/`)
- **UI & Scanner**: Tailwind CSS, Lucide Icons, `html5-qrcode`

---

## 3. Dokumentasi Proyek (`/docs`)

- [PRD - Product Requirements Document](./docs/prd.md)
- [Architecture Decisions & Patterns](./docs/architect.md)
- [Technical Specifications & Database Schema](./docs/tech-spec.md)
- [Team Collaboration & Workflow](./docs/team-workflow.md)
- [AI Agent Boundaries](./docs/agent-boundaries.md)
- [Pending Changelog](./docs/changelog/pending.md)

---

## 4. Pengembangan Lokal

Pastikan **Node.js 20+** dan **pnpm** sudah terpasang.

```bash
# 1. Salin template environment variables
cp .env.example .env.local

# 2. Isi kredensial Supabase & DATABASE_URL di .env.local:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY (untuk auto-bucket Supabase Storage)
#    DATABASE_URL (Transaction Pooler port 6543)
#    DIRECT_URL (Direct connection port 5432 untuk drizzle-kit push)

# 3. Install dependencies
pnpm install

# 4. Sinkronkan skema Drizzle ke Supabase PostgreSQL
pnpm db:push

# 5. Jalankan server development
pnpm dev
```

Verifikasi build sebelum push:

```bash
pnpm tsc --noEmit
pnpm next build
```

---

## 5. Alur Deploy ke Cloudflare (Cloudflare Workers)

Aplikasi ini menggunakan Next.js 15 App Router dengan Server Actions dan koneksi PostgreSQL (`postgres` + `drizzle-orm`), sehingga target deploy yang direkomendasikan di Cloudflare adalah **Cloudflare Workers** menggunakan `@opennextjs/cloudflare` (dengan flag `nodejs_compat` yang sudah disiapkan di `wrangler.jsonc` dan `open-next.config.ts`).

### A. Persiapan Sekali di Awal (Lokal)

1. Install adapter OpenNext Cloudflare dan Wrangler CLI sebagai devDependency:
   ```bash
   pnpm add -D @opennextjs/cloudflare wrangler
   ```
2. Login ke akun Cloudflare Anda:
   ```bash
   pnpm dlx wrangler login
   ```

### B. Deploy dari CLI (Manual / Cepat)

1. Build bundle Cloudflare Worker:
   ```bash
   pnpm dlx opennextjs-cloudflare build
   ```
2. Daftarkan Environment Variables / Secrets di Cloudflare Worker (wajib agar Auth, Database, dan Upload Storage berjalan di production):
   ```bash
   pnpm dlx wrangler secret put DATABASE_URL
   pnpm dlx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   pnpm dlx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
   pnpm dlx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   *(Atau tambahkan variabel `NEXT_PUBLIC_*` di Cloudflare Dashboard -> Workers & Pages -> Settings -> Variables and Secrets).*
3. Deploy ke Cloudflare:
   ```bash
   pnpm dlx wrangler deploy
   ```

### C. Deploy Otomatis via GitHub (Cloudflare Workers Builds)

1. Buka **Cloudflare Dashboard** -> **Workers & Pages** -> **Create** -> **Import a repository**.
2. Pilih repository `oktaamyid/Logicodix` dan branch production **`main`** (atau **`staging`** untuk preview).
3. Atur konfigurasi build:
   - **Build command**: `pnpm dlx opennextjs-cloudflare build`
   - **Deploy command**: `pnpm dlx wrangler deploy`
4. Masukkan seluruh environment variables dari `.env.example` di menu **Settings -> Variables and Secrets**.
5. **Penting untuk Google OAuth & Kamera**:
   - Setelah mendapatkan domain `*.workers.dev` atau custom domain HTTPS, daftarkan URL callback `https://domain-anda/auth/callback` di **Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs**.
   - Akses HTTPS di Cloudflare otomatis mengaktifkan izin **kamera browser** untuk fitur Scan Barcode Kasir.

---

## 6. Tim Pengembang

| Developer | Akun GitHub | Domain Fokus | Lokasi Modul Utama |
| :--- | :--- | :--- | :--- |
| **Developer 1** (Lead) | [@oktaamyid](https://github.com/oktaamyid) | Core Auth, Onboarding UMKM, Smart POS & Inventori | `src/app/(auth)/`, `src/app/dashboard/operational/` |
| **Developer 2** | [@pompomv](https://github.com/pompomv) | Direktori Ekonomi Kreatif, Storefront Publik & Order | `src/app/(market)/`, `src/app/dashboard/orders/` |
| **Developer 3** | [@wildanfarizy](https://github.com/wildanfarizy) | Buku Kas Keuangan, Laba-Rugi & Analitik Bisnis | `src/app/dashboard/management/` |
