# Niagarupa — Platform Digitalisasi UMKM & Ekonomi Kreatif Lokal
> **Event**: Logicodix | **Track**: Local MSME & Creative Economy Hub

**Niagarupa** (*Karya Berdaya, Niaga Tertata*) adalah platform *All-in-One* untuk **Digitalisasi Operasional UMKM Lokal, Akses Pasar Ekonomi Kreatif, dan Optimasi Manajemen Bisnis**.

---

## 1. Tiga Pilar Utama

1. **Digitalisasi Operasional (`Domain 1`)**: Kasir Pintar (*Smart POS*), manajemen produk dengan Harga Pokok Penjualan (HPP), pelacakan mutasi stok real-time, dan peringatan stok menipis.
2. **Akses Pasar & Ekonomi Kreatif (`Domain 2`)**: Direktori eksplorasi UMKM daerah (`/explore`), pembuatan halaman katalog toko mikro otomatis (`/store/[slug]`), keranjang belanja, checkout terintegrasi WhatsApp, dan manajemen pesanan masuk.
3. **Optimasi Manajemen Bisnis (`Domain 3`)**: Pembukuan keuangan otomatis (pemasukan POS/Online & pengeluaran operasional), perhitungan Laba Kotor & Laba Bersih instan, deteksi produk *Fast-Moving* vs *Deadstock*, serta rekomendasi *Restock*.

---

## 2. Tech Stack

- **Framework**: Next.js (App Router), React Server Components, Server Actions
- **Language**: TypeScript (`strict: true`)
- **Database & Auth**: Supabase (PostgreSQL, `@supabase/ssr` Auth, Storage, Row Level Security)
- **ORM & Migrations**: Drizzle ORM + `drizzle-kit`
- **Validation**: Zod (`/src/lib/schemas/`)
- **UI & Styling**: Tailwind CSS, shadcn/ui, Lucide Icons, Recharts

---

## 3. Dokumentasi Wajib Tim (Pre-Coding Checklist)

Sebelum menulis atau memodifikasi kode, seluruh anggota tim (3 Fullstack Developers) wajib mengacu pada dokumen di folder `/docs`:

- [PRD — Product Requirements Document](./docs/prd.md)
- [Architecture Decisions & Patterns](./docs/architect.md)
- [Technical Specifications & Database Schema](./docs/tech-spec.md)
- [Team Collaboration & Workflow (3 Developers)](./docs/team-workflow.md)
- [AI Agent Boundaries & Role Governance](./docs/agent-boundaries.md)
- [Pending Changelog](./docs/changelog/pending.md)

---

## 4. Pembagian Tim (3 Fullstack Developers)

| Developer | Akun GitHub | Domain Fokus | Lokasi Modul Utama |
| :--- | :--- | :--- | :--- |
| **Developer 1** (Lead) | [@oktaamyid](https://github.com/oktaamyid) | Core Auth, Onboarding UMKM, Smart POS & Inventori | `src/app/(auth)/`, `src/app/(dashboard)/operational/` |
| **Developer 2** | [@pompomv](https://github.com/pompomv) | Direktori Ekonomi Kreatif, Storefront Publik & Order | `src/app/(market)/`, `src/app/(dashboard)/orders/` |
| **Developer 3** | [@wildanfarizy](https://github.com/wildanfarizy) | Buku Kas Keuangan, Laba-Rugi & Analitik Optimasi Bisnis | `src/app/(dashboard)/management/` |

> *Setiap AI Agent yang membantu masing-masing developer wajib mematuhi batasan file dan folder di [docs/agent-boundaries.md](./docs/agent-boundaries.md).*

---

## 5. Quickstart (Inisialisasi Lokal)

```bash
# 1. Salin template environment variables
cp .env.example .env.local

# 2. Isi kredensial Supabase & DATABASE_URL di .env.local

# 3. Install dependencies (setelah bootstrap Next.js)
npm install

# 4. Push/Migrate skema Drizzle ke Supabase PostgreSQL
npx drizzle-kit push

# 5. Jalankan server development
npm run dev
```
