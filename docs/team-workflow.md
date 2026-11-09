# Team Collaboration & Workflow Guide (`team-workflow.md`)
## Project: Logicodix — 3 Fullstack Developers Squad

Dokumen ini mengatur pembagian peran, kepemilikan file (*file ownership*), alur kerja Git, dan jadwal Sprint untuk **3 orang Fullstack Developer** agar pengembangan paralel berjalan cepat tanpa konflik kode (*merge conflict*).

---

## 1. Pembagian Peran & Domain Fitur (3 Fullstack Developers)

Setiap anggota tim bertanggung jawab penuh secara **End-to-End (Database Schema → Zod Validation → Server Actions → UI Components)** pada domain masing-masing:

| Anggota Tim | Domain Tanggung Jawab | Fokus Modul Utama | Area Direktori & File Ownership |
| :--- | :--- | :--- | :--- |
| **Developer 1**<br>*(Core & Operational Lead)* | **Digitalisasi Operasional UMKM** | • Setup Supabase Auth & Onboarding Toko<br>• CRUD Produk, Kategori, & Upload Foto<br>• Mutasi Stok & Low-Stock Alert<br>• Kasir Pintar (Smart POS) & Struk Digital | • `src/app/(auth)/**`<br>• `src/app/(dashboard)/operational/**`<br>• `src/components/operational/**`<br>• `src/lib/db/schema/core.ts` & `operational.ts`<br>• `src/lib/schemas/operational.schema.ts` |
| **Developer 2**<br>*(Market Access & Storefront Lead)* | **Akses Pasar & Ekonomi Kreatif** | • Landing Page & Direktori Eksplorasi UMKM (`/explore`)<br>• Micro-Storefront Publik (`/store/[slug]`)<br>• Keranjang Belanja & Checkout WhatsApp<br>• Pipeline Pesanan Masuk & Kupon Promo | • `src/app/(market)/**`<br>• `src/app/(dashboard)/orders/**`<br>• `src/components/market/**`<br>• `src/lib/db/schema/market.ts`<br>• `src/lib/schemas/market.schema.ts` |
| **Developer 3**<br>*(Business Management & Analytics Lead)* | **Optimasi Manajemen Bisnis** | • Buku Kas Keuangan (Pemasukan & Beban Operasional)<br>• Kalkulasi Laba Kotor (HPP) & Laba Bersih<br>• Dashboard Analitik Penjualan & Grafik Tren<br>• Deteksi *Fast-Moving*, *Deadstock*, & Rekomendasi Restock | • `src/app/(dashboard)/management/**`<br>• `src/components/management/**`<br>• `src/lib/db/schema/management.ts`<br>• `src/lib/schemas/management.schema.ts` |

> **Catatan File Bersama (`Shared Files`)**:
> Perubahan pada `src/lib/db/index.ts`, `src/app/(dashboard)/layout.tsx`, atau instalasi library di `package.json` wajib dikomunikasikan di grup tim sebelum melakukan merge ke `staging`.

---

## 2. Git & Branching Strategy

Sesuai standar kualitas proyek, kita menggunakan alur **Git Feature Branching** dengan 2 branch utama:

1. **`main`**: Branch produksi (*production-ready*). Hanya boleh di-merge dari `staging` setelah lulus uji coba.
2. **`staging`**: Branch integrasi tim. Semua fitur dari ketiga developer digabungkan dan diuji bersama di sini.
3. **Feature / Fix Branches**:
   - Format: `feat/[domain]-[nama-fitur]` atau `fix/[nomor-issue]-[deskripsi]`
   - Contoh Developer 1: `feat/op-smart-pos-checkout`
   - Contoh Developer 2: `feat/mkt-public-storefront`
   - Contoh Developer 3: `feat/mgmt-profit-loss-ledger`

### Standar Commit Message (Conventional Commits)
- `feat: add atomic POS checkout server action`
- `fix: resolve stock deduction calculation on online order`
- `refactor: extract currency formatter to utils`
- `docs: update tech-spec database schema`
- `test: add unit test for deadstock detection formula`

---

## 3. Roadmap & Sprint Plan (4 Tahap Eksekusi)

### Tahap 1: Foundation & Database Contract (Hari 1 - 2)
- **[Bersama]** Inisialisasi repositori Next.js App Router, Tailwind CSS, shadcn/ui, dan Drizzle ORM.
- **[Dev 1]** Setup Supabase Project, Auth Middleware (`@supabase/ssr`), dan migrasi skema tabel `stores` + `operational`.
- **[Dev 2]** Migrasi skema tabel `market` (`orders`, `order_items`, `vouchers`) dan kerangka layout publik.
- **[Dev 3]** Migrasi skema tabel `management` (`financial_entries`), pembuatan helper `formatIDR`, dan komponen layout Dashboard utama (`/dashboard/layout.tsx`).
- **Milestone 1**: Database PostgreSQL sudah termigrasi penuh beserta data *seeder* UMKM contoh.

### Tahap 2: Core Feature Development — Paralel (Hari 3 - 7)
- **[Dev 1]** Membangun halaman Onboarding Toko, CRUD Produk + Upload Gambar ke Supabase Storage, dan Manajemen Stok.
- **[Dev 2]** Membangun Direktori `/explore` (filter subsektor ekonomi kreatif & kota) serta halaman Micro-Storefront `/store/[slug]` + Keranjang Belanja.
- **[Dev 3]** Membangun halaman Buku Kas (`/dashboard/management/finance`), form input pengeluaran operasional, dan kartu ringkasan Laba Kotor/Bersih.
- **Milestone 2**: UMKM sudah bisa mendaftar, menambah produk, tampil di direktori publik, dan mencatat pengeluaran.

### Tahap 3: Transaksi Terpadu & Business Intelligence (Hari 8 - 11)
- **[Dev 1]** Membangun halaman Kasir (Smart POS) dengan transaksi atomik (`processPosCheckoutAction`) dan cetak/unduh struk digital.
- **[Dev 2]** Membangun Checkout Publik ke WhatsApp & Dashboard Manajemen Pesanan Masuk (`updateOrderStatusAction` yang terhubung ke stok & buku kas).
- **[Dev 3]** Membangun Dashboard Analitik (`/dashboard/management/analytics`): Grafik tren omzet, klasifikasi produk (*Fast-Moving* vs *Deadstock*), dan peringatan *Restock Segera*.
- **Milestone 3**: Siklus penuh dari kasir/order online langsung memperbarui stok inventori dan laporan laba-rugi secara otomatis.

### Tahap 4: Integrasi Akhir, Red Team Review & Deployment (Hari 12 - 14)
- **[Bersama]** Audit keamanan Row Level Security (RLS) dan validasi Zod di seluruh Server Actions.
- **[Bersama]** Audit performa (LCP < 2.5s, Bundle size < 200KB, pastikan semua `next/image` dan `<Suspense>` terpasang).
- **[Bersama]** Uji skenario *end-to-end* untuk persiapan presentasi/demo dan deployment ke produksi (Vercel / Dokploy).
