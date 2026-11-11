# Architecture Decisions & Patterns (`architect.md`)
## Product: Niagarupa (Event: Logicodix — Local MSME & Creative Economy Hub)

Dokumen ini merupakan acuan arsitektur tunggal (*Single Source of Truth*) untuk tim pengembang (3 Fullstack Developers). Seluruh kode wajib mematuhi pola dan batasan yang ditetapkan di sini.

---

## 1. High-Level System Architecture

Logicodix dibangun menggunakan arsitektur **Modular Monolith berbasis Next.js App Router** dengan **Supabase (PostgreSQL + Auth + Storage)** dan **Drizzle ORM**.

```
[Client Browser / Mobile Device]
       │
       ├── Public Routes (/explore, /store/[slug]) ──► Next.js Server Components (SSR / ISR)
       │                                                       │
       ├── Merchant Dashboard (/dashboard/*) ────────► Next.js Server Components + Suspense
       │                                                       │
       └── Mutations (POS, Inventory, Orders, Ledger) ► Next.js Server Actions (Zod Validated)
                                                               │
                                                  ┌────────────┴────────────┐
                                                  ▼                         ▼
                                       [Drizzle ORM (Postgres)]   [@supabase/ssr (Auth/Storage/RLS)]
                                                  │                         │
                                                  └────────────┬────────────┘
                                                               ▼
                                                [Supabase PostgreSQL + Storage]
```

---

## 2. Core Architectural Principles

### 2.1 Next.js App Router & Rendering Strategy
- **App Router Eksklusif**: Seluruh routing berada di dalam `src/app/` (atau `app/`). Dilarang menggunakan `pages/`.
- **Server Components by Default**: Semua halaman (`page.tsx`) dan layout (`layout.tsx`) adalah React Server Components (RSC) secara default untuk meminimalkan JavaScript di sisi klien.
- **Leaf-Level Client Components (`'use client'`)**:
  - Direktif `'use client'` **HANYA** boleh dipasang pada komponen daun (*leaf components*) yang membutuhkan interaktivitas (`useState`, `useEffect`, event handlers seperti keranjang POS, form input, atau chart interaktif).
  - Jangan pernah meletakkan `'use client'` di level `page.tsx` atau `layout.tsx`.
- **Suspense Boundaries**: Setiap pengambilan data asinkron pada Server Component wajib dibungkus dengan `<Suspense fallback={<Skeleton />}>` agar navigasi instan dan tidak memblokir rendering halaman penuh.

### 2.2 Mutations via Server Actions
- Semua operasi mutasi data (`CREATE`, `UPDATE`, `DELETE`) wajib menggunakan **Server Actions** yang ditempatkan di `src/app/[domain]/actions.ts` atau `src/app/actions.ts`.
- **Route Handlers (`src/app/api/...`)** HANYA diizinkan untuk:
  1. Webhook eksternal (Payment Gateway, WhatsApp Webhook, dll.)
  2. Callback autentikasi (`/api/auth/callback`)
  3. Ekspor file stream (CSV/PDF download)
- Setiap Server Action wajib mengembalikan tipe standar `ActionResponse<T>`:

```typescript
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### 2.3 Validation Strategy (Zod-First)
- Tidak ada input dari klien yang boleh dipercaya.
- Seluruh skema validasi ditempatkan secara terpusat di `src/lib/schemas/[domain].schema.ts`.
- Setiap Server Action wajib memvalidasi parameter, `FormData`, atau payload menggunakan `schema.safeParse()` sebelum menyentuh database.

### 2.4 Database Access: Hybrid Supabase SSR + Drizzle ORM
- **Autentikasi & Session**: Menggunakan `@supabase/ssr` (`createServerClient` untuk RSC/Server Actions/Middleware dan `createBrowserClient` untuk Client Components).
- **Database Queries & Transactions**: Menggunakan **Drizzle ORM** (`src/lib/db/`) di sisi server untuk:
  - Type-safety penuh dari skema PostgreSQL ke TypeScript.
  - Transaksi atomik (`db.transaction(...)`) yang krusial pada fitur **POS Checkout** (membuat order + mengurangi stok inventori + mencatat mutasi stok + menulis jurnal pemasukan dalam satu transaksi ACID).
- **Row Level Security (RLS)**: Diaktifkan pada seluruh tabel di PostgreSQL sebagai lapisan pertahanan kedua (*defense-in-depth*).

---

## 3. Domain-Driven Directory Structure

Untuk mendukung kolaborasi **3 Fullstack Developers** tanpa konflik Git (*merge conflict*), kode diorganisasikan berdasarkan **3 Domain Fitur** menggunakan Route Groups Next.js:

```text
src/
├── app/
│   ├── (auth)/                     # Login, Register, Onboarding UMKM
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── actions.ts
│   ├── (market)/                   # [DOMAIN 2] Akses Pasar & Katalog Publik
│   │   ├── explore/page.tsx        # Direktori UMKM & Ekonomi Kreatif
│   │   ├── store/[slug]/page.tsx   # Micro-Storefront tiap UMKM
│   │   ├── checkout/page.tsx       # Checkout pelanggan publik
│   │   └── actions.ts              # Server Actions khusus pemesanan publik
│   ├── (dashboard)/                # Area Terproteksi Pemilik/Staf UMKM
│   │   ├── layout.tsx              # Sidebar & Header Dashboard
│   │   ├── operational/            # [DOMAIN 1] Operasional: POS & Inventori
│   │   │   ├── pos/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   └── actions.ts
│   │   ├── orders/                 # [DOMAIN 2] Manajemen Pesanan Masuk & Promo
│   │   │   ├── page.tsx
│   │   │   ├── vouchers/page.tsx
│   │   │   └── actions.ts
│   │   └── management/             # [DOMAIN 3] Keuangan, Analitik & Optimasi
│   │       ├── overview/page.tsx
│   │       ├── finance/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── actions.ts
│   ├── api/
│   │   └── auth/callback/route.ts  # Supabase OAuth/Email Callback
│   ├── layout.tsx
│   └── page.tsx                    # Landing Page Logicodix
├── components/
│   ├── ui/                         # shadcn/ui primitives (Button, Dialog, Table, dll.)
│   ├── shared/                     # Komponen lintas domain (Navbar, EmptyState, CurrencyText)
│   ├── operational/                # [DOMAIN 1] Komponen POS & Inventori
│   ├── market/                     # [DOMAIN 2] Komponen Katalog, Storefront & Order
│   └── management/                 # [DOMAIN 3] Komponen Chart, Buku Kas & Insight
├── lib/
│   ├── db/
│   │   ├── index.ts                # Koneksi Drizzle ORM
│   │   ├── schema/                 # Definisi tabel Drizzle per domain
│   │   │   ├── core.ts             # stores, store_members
│   │   │   ├── operational.ts      # categories, products, stock_movements
│   │   │   ├── market.ts           # orders, order_items, vouchers, reviews
│   │   │   └── management.ts       # financial_entries, business_targets
│   │   └── migrations/             # File migrasi SQL Drizzle
│   ├── supabase/
│   │   ├── server.ts               # createServerClient (@supabase/ssr)
│   │   ├── client.ts               # createBrowserClient (@supabase/ssr)
│   │   └── middleware.ts           # Session refresh & route guard
│   ├── schemas/                    # Zod Validation Schemas per domain
│   │   ├── operational.schema.ts
│   │   ├── market.schema.ts
│   │   └── management.schema.ts
│   ├── types/
│   │   └── action-response.ts      # Standar ActionResponse<T>
│   └── utils.ts                    # Helper cn(), formatIDR(), date-fns helpers
└── middleware.ts                   # Next.js Middleware (Auth guard)
```

---

## 4. Coding & Component Standards

1. **NO Barrel Files (`index.ts`) untuk Komponen**:
   - Dilarang membuat file `index.ts` yang me-re-export komponen karena memperbesar ukuran bundle dan menghambat tree-shaking.
   - Selalu impor langsung dari path spesifik: `import { Button } from "@/components/ui/button"`.
2. **Named Exports Only**:
   - Gunakan `export function ComponentName()` untuk semua komponen React.
   - Default export (`export default`) hanya digunakan di file khusus Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
3. **Strict TypeScript**:
   - Dilarang menggunakan `any`. Gunakan `unknown` lalu persempit tipe (*type narrowing*) atau inferensi dari Zod (`z.infer<typeof schema>`) dan Drizzle (`typeof table.$inferSelect`).
4. **Images & Media**:
   - Dilarang menggunakan tag `<img>` HTML biasa. Wajib menggunakan `next/image` dengan properti `width` dan `height` eksplisit (atau `fill` di dalam container berdimensi).
5. **Dependencies Policy**:
   - Gunakan `date-fns` untuk manipulasi tanggal (dilarang `moment.js`).
   - Gunakan native `fetch` (dilarang `axios`).
   - Gunakan method JS native untuk manipulasi array/objek.
