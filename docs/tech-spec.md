# Technical Specifications (`tech-spec.md`)
## Product: Niagarupa (Event: Logicodix — Local MSME & Creative Economy Hub)

---

## 1. Tech Stack & Library Matrix

| Layer | Teknologi | Versi Target | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `^15.x` / `^14.2.x` | RSC, Server Actions, Streaming Suspense, SEO optimal untuk Direktori UMKM |
| **Language** | TypeScript (Strict Mode) | `^5.x` | Type-safety penuh dari database hingga UI |
| **Styling & UI** | Tailwind CSS + shadcn/ui + Lucide Icons | `^3.4.x` | Konsistensi desain, aksesibilitas (Radix UI), zero runtime overhead |
| **Database** | Supabase PostgreSQL | PostgreSQL 15+ | Managed Postgres, Row Level Security (RLS), Realtime, Built-in Storage |
| **ORM & Migrations** | Drizzle ORM + `drizzle-kit` | `^0.36.x` | Ringan, SQL-like, mendukung transaksi ACID kompleks, type inference cepat |
| **Authentication** | `@supabase/ssr` + `@supabase/supabase-js` | Latest | Cookie-based SSR Auth terintegrasi dengan Next.js Middleware |
| **Validation** | Zod + `react-hook-form` | `^3.23.x` | Validasi skema tunggal untuk Client Form & Server Action |
| **Date & Charts** | `date-fns` + `recharts` (shadcn chart) | `^3.x` / `^2.x` | Ringan, modular, mendukung visualisasi analitik UMKM |

---

## 2. Database Schema Specification (PostgreSQL & Drizzle ORM)

Seluruh nilai mata uang disimpan dalam tipe **` integer` atau `bigint` (dalam satuan Rupiah penuh, tanpa desimal pecahan sen)** untuk menghindari ketidakakuratan floating-point.

### 2.1 Enums PostgreSQL

```sql
CREATE TYPE creative_subsector AS ENUM (
  'kuliner', 'kriya', 'fashion', 'desain', 'seni_pertunjukan',
  'fotografi', 'musik', 'penerbitan', 'aplikasi_game', 'lainnya'
);

CREATE TYPE member_role AS ENUM ('owner', 'cashier', 'staff');

CREATE TYPE stock_movement_type AS ENUM (
  'initial', 'restock', 'sale_pos', 'sale_online', 'adjustment', 'damaged'
);

CREATE TYPE order_channel AS ENUM ('pos', 'online_storefront', 'whatsapp');

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'completed', 'cancelled'
);

CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'bank_transfer');

CREATE TYPE ledger_entry_type AS ENUM ('income', 'expense');

CREATE TYPE expense_category AS ENUM (
  'raw_material', 'operational', 'salary', 'rent', 'utilities', 'marketing', 'other'
);
```

### 2.2 Tabel Core (`src/lib/db/schema/core.ts`)

1. **`stores` (Profil UMKM / Tenant)**
   - `id`: `uuid` (PK, default `gen_random_uuid()`)
   - `owner_id`: `uuid` (FK ke `auth.users.id`, `NOT NULL`)
   - `name`: `varchar(120)` (`NOT NULL`)
   - `slug`: `varchar(140)` (`UNIQUE`, `NOT NULL`, diindeks untuk `/store/[slug]`)
   - `subsector`: `creative_subsector` (`NOT NULL`, default `'kuliner'`)
   - `description`: `text`
   - `whatsapp_number`: `varchar(20)` (`NOT NULL`, format `628...`)
   - `city`: `varchar(80)` (`NOT NULL`)
   - `address`: `text`
   - `logo_url`: `text`
   - `banner_url`: `text`
   - `is_active`: `boolean` (default `true`)
   - `created_at`: `timestamptz` (default `now()`)
   - `updated_at`: `timestamptz` (default `now()`)

2. **`store_members` (Akses Multi-User / Staf UMKM)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE)
   - `user_id`: `uuid` (FK `auth.users.id` ON DELETE CASCADE)
   - `role`: `member_role` (`NOT NULL`, default `'owner'`)
   - `created_at`: `timestamptz`
   - *Unique Constraint*: `(store_id, user_id)`

### 2.3 Tabel Domain 1: Operasional (`src/lib/db/schema/operational.ts`)

3. **`categories` (Kategori Produk per Toko)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE, `NOT NULL`)
   - `name`: `varchar(80)` (`NOT NULL`)
   - `slug`: `varchar(100)` (`NOT NULL`)

4. **`products` (Katalog & Inventori Produk UMKM)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE, `NOT NULL`)
   - `category_id`: `uuid` (FK `categories.id` ON DELETE SET NULL)
   - `sku`: `varchar(50)` (`NOT NULL`)
   - `name`: `varchar(150)` (`NOT NULL`)
   - `description`: `text`
   - `image_url`: `text`
   - `cost_price`: `integer` (`NOT NULL`, default `0` — Harga Pokok Penjualan / HPP dalam IDR)
   - `selling_price`: `integer` (`NOT NULL` — Harga Jual dalam IDR)
   - `stock_quantity`: `integer` (`NOT NULL`, default `0`)
   - `low_stock_threshold`: `integer` (`NOT NULL`, default `5`)
   - `unit`: `varchar(20)` (default `'pcs'` — pcs, porsi, kg, box)
   - `is_published`: `boolean` (default `true` — tampil di Storefront publik)
   - `is_active`: `boolean` (default `true`)
   - `created_at`: `timestamptz`
   - `updated_at`: `timestamptz`

5. **`stock_movements` (Audit Trail Mutasi Stok)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE, `NOT NULL`)
   - `product_id`: `uuid` (FK `products.id` ON DELETE CASCADE, `NOT NULL`)
   - `type`: `stock_movement_type` (`NOT NULL`)
   - `quantity_change`: `integer` (`NOT NULL` — positif untuk barang masuk, negatif untuk keluar)
   - `previous_stock`: `integer` (`NOT NULL`)
   - `current_stock`: `integer` (`NOT NULL`)
   - `reference_order_id`: `uuid` (Nullable, FK `orders.id`)
   - `notes`: `text`
   - `created_by`: `uuid` (FK `auth.users.id`)
   - `created_at`: `timestamptz` (default `now()`)

### 2.4 Tabel Domain 2: Akses Pasar & Order (`src/lib/db/schema/market.ts`)

6. **`vouchers` (Kupon Diskon Toko)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE)
   - `code`: `varchar(30)` (`NOT NULL`)
   - `discount_amount`: `integer` (`NOT NULL`)
   - `min_purchase`: `integer` (default `0`)
   - `quota`: `integer` (default `100`)
   - `used_count`: `integer` (default `0`)
   - `valid_until`: `timestamptz`
   - `is_active`: `boolean` (default `true`)

7. **`orders` (Transaksi POS & Pesanan Online)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE, `NOT NULL`)
   - `order_number`: `varchar(40)` (`UNIQUE`, `NOT NULL`, contoh: `INV-20261109-0001`)
   - `channel`: `order_channel` (`NOT NULL`)
   - `status`: `order_status` (`NOT NULL`, default `'pending'`)
   - `customer_name`: `varchar(100)` (default `'Pelanggan Umum'`)
   - `customer_phone`: `varchar(20)`
   - `customer_address`: `text`
   - `subtotal_amount`: `integer` (`NOT NULL`)
   - `discount_amount`: `integer` (`NOT NULL`, default `0`)
   - `total_amount`: `integer` (`NOT NULL`)
   - `total_cost_amount`: `integer` (`NOT NULL` — akumulasi HPP saat transaksi terjadi untuk akurasi laba kotor historis)
   - `payment_method`: `payment_method` (`NOT NULL`, default `'cash'`)
   - `notes`: `text`
   - `created_by`: `uuid` (Nullable — diisi ID kasir jika dari POS)
   - `created_at`: `timestamptz` (default `now()`)
   - `completed_at`: `timestamptz`

8. **`order_items` (Detail Item per Transaksi)**
   - `id`: `uuid` (PK)
   - `order_id`: `uuid` (FK `orders.id` ON DELETE CASCADE, `NOT NULL`)
   - `product_id`: `uuid` (FK `products.id` ON DELETE RESTRICT, `NOT NULL`)
   - `product_name_snapshot`: `varchar(150)` (`NOT NULL`)
   - `quantity`: `integer` (`NOT NULL`)
   - `unit_cost_snapshot`: `integer` (`NOT NULL` — HPP per unit saat transaksi)
   - `unit_price_snapshot`: `integer` (`NOT NULL` — Harga jual per unit saat transaksi)
   - `subtotal`: `integer` (`NOT NULL`)

### 2.5 Tabel Domain 3: Manajemen Bisnis & Keuangan (`src/lib/db/schema/management.ts`)

9. **`financial_entries` (Jurnal Buku Kas Pemasukan & Pengeluaran)**
   - `id`: `uuid` (PK)
   - `store_id`: `uuid` (FK `stores.id` ON DELETE CASCADE, `NOT NULL`)
   - `type`: `ledger_entry_type` (`NOT NULL` — `'income'` atau `'expense'`)
   - `expense_category`: `expense_category` (Nullable — diisi jika `type = 'expense'`)
   - `amount`: `integer` (`NOT NULL`)
   - `description`: `varchar(255)` (`NOT NULL`)
   - `reference_order_id`: `uuid` (Nullable, FK `orders.id` ON DELETE SET NULL)
   - `transaction_date`: `timestamptz` (`NOT NULL`, default `now()`)
   - `created_by`: `uuid` (FK `auth.users.id`)
   - `created_at`: `timestamptz` (default `now()`)

---

## 3. Server Actions & Zod Contracts

### 3.1 Standar Response (`src/lib/types/action-response.ts`)

```typescript
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### 3.2 Kontrak Server Action per Domain

| Domain | File Lokasi | Nama Fungsi Server Action | Deskripsi & Efek Samping Database |
| :--- | :--- | :--- | :--- |
| **Auth / Core** | `src/app/(auth)/actions.ts` | `createStoreOnboardingAction` | Membuat record `stores` + `store_members` (`role: 'owner'`), revalidate `/dashboard`. |
| **Domain 1 (Operasional)** | `src/app/(dashboard)/operational/actions.ts` | `upsertProductAction` | Validasi Zod, simpan ke `products`, catat `stock_movements` (`type: 'initial'`) jika produk baru. |
| **Domain 1 (Operasional)** | `src/app/(dashboard)/operational/actions.ts` | `adjustStockAction` | Tambah/kurangi stok produk secara atomik & simpan log di `stock_movements`. |
| **Domain 1 (Operasional)** | `src/app/(dashboard)/operational/actions.ts` | `processPosCheckoutAction` | **Transaksi Atomik**: Cek ketersediaan stok → Buat `orders` (`status: 'completed'`, `channel: 'pos'`) → Buat `order_items` → Kurangi `products.stock_quantity` → Buat `stock_movements` (`sale_pos`) → Buat `financial_entries` (`income`). |
| **Domain 2 (Akses Pasar)** | `src/app/(market)/actions.ts` | `createPublicOrderAction` | Validasi keranjang publik → Cek kupon diskon → Buat `orders` (`status: 'pending'`, `channel: 'online_storefront'`) → Buat `order_items` → Kembalikan URL WhatsApp pre-filled beserta nomor invoice. |
| **Domain 2 (Akses Pasar)** | `src/app/(dashboard)/orders/actions.ts` | `updateOrderStatusAction` | Mengubah status pesanan online. Saat status berubah menjadi `'completed'`, jalankan transaksi atomik pemotongan stok (`sale_online`) & pencatatan `financial_entries` (`income`). |
| **Domain 3 (Manajemen)** | `src/app/(dashboard)/management/actions.ts` | `recordExpenseAction` | Mencatat pengeluaran operasional ke `financial_entries` (`type: 'expense'`). |
| **Domain 3 (Manajemen)** | `src/app/(dashboard)/management/actions.ts` | `deleteFinancialEntryAction` | Menghapus catatan pengeluaran manual (tidak mengizinkan penghapusan jurnal otomatis dari order). |

---

## 4. Rumus & Algoritma Optimasi Bisnis (Domain 3)

Untuk memenuhi pilar **Optimasi Manajemen Bisnis**, sistem menghitung metrik berikut di Server Component menggunakan query agregasi SQL:

1. **Pendapatan Kotor (Gross Revenue)**:
   $$\text{Gross Revenue} = \sum \text{orders.total\_amount} \quad (\text{di mana } \text{status} = \text{'completed'})$$

2. **Harga Pokok Penjualan Total (Total COGS / HPP)**:
   $$\text{Total COGS} = \sum \text{orders.total\_cost\_amount} \quad (\text{di mana } \text{status} = \text{'completed'})$$

3. **Laba Kotor (Gross Profit) & Gross Margin (%)**:
   $$\text{Gross Profit} = \text{Gross Revenue} - \text{Total COGS}$$
   $$\text{Gross Margin (\%)} = \left( \frac{\text{Gross Profit}}{\text{Gross Revenue}} \right) \times 100$$

4. **Laba Bersih Operasional (Net Profit)**:
   $$\text{Net Profit} = \text{Gross Profit} - \sum \text{financial\_entries.amount}_{\text{type = 'expense'}}$$

5. **Prediksi Habis Stok (Days of Inventory Remaining)**:
   - Hitung *Daily Burn Rate* (rata-rata unit terjual per hari dalam 30 hari terakhir):
     $$\text{Daily Burn Rate} = \frac{\text{Total Unit Terjual (30 Hari)}}{30}$$
   - Estimasi hari tersisa sebelum stok habis:
     $$\text{Days Remaining} = \left\lfloor \frac{\text{stock\_quantity}}{\max(\text{Daily Burn Rate}, 0.1)} \right\rfloor$$
   - Jika $\text{Days Remaining} \le 7$, sistem memunculkan badge **"Restock Segera"**.

6. **Deteksi Deadstock (Stok Mengendap)**:
   - Produk dengan `stock_quantity > low_stock_threshold` namun memiliki **0 penjualan dalam 30 hari terakhir** diklasifikasikan sebagai **Deadstock** dan diberikan rekomendasi otomatis: *"Buat paket bundling atau voucher diskon di Storefront"*.

---

## 5. Row Level Security (RLS) Policy Matrix

- **Tabel `stores` & `products`**:
  - `SELECT` Publik: Diizinkan untuk semua orang (`anon` & `authenticated`) jika `is_active = true` (dan `is_published = true` untuk produk) agar halaman `/explore` dan `/store/[slug]` dapat diakses publik.
  - `INSERT / UPDATE / DELETE`: Hanya diizinkan jika `auth.uid()` terdaftar di `store_members` untuk `store_id` terkait.
- **Tabel `orders` & `order_items`**:
  - `INSERT` Publik: Diizinkan untuk pembuatan pesanan dari storefront (`channel = 'online_storefront'`).
  - `SELECT / UPDATE`: Hanya diizinkan bagi anggota toko (`store_members`) yang memiliki akses ke `store_id` tersebut.
- **Tabel `stock_movements` & `financial_entries`**:
  - `ALL`: Hanya diizinkan bagi anggota toko (`store_members`) yang terautentikasi.
