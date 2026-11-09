import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Daftar subsektor Ekonomi Kreatif sesuai klasifikasi Kemenparekraf / UMKM Lokal.
 */
export const creativeSubsectorEnum = pgEnum("creative_subsector", [
  "kuliner",
  "kriya",
  "fashion",
  "desain",
  "seni_pertunjukan",
  "fotografi",
  "musik",
  "penerbitan",
  "aplikasi_game",
  "lainnya",
]);

/**
 * Peran pengguna di dalam satu entitas toko UMKM.
 */
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "cashier",
  "staff",
]);

/**
 * Tabel `stores` menyimpan profil utama tenant UMKM & Ekonomi Kreatif.
 * Setiap toko memiliki halaman micro-storefront publik berbasis `slug`.
 */
export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(), // Referensi ke auth.users.id di Supabase
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    subsector: creativeSubsectorEnum("subsector").default("kuliner").notNull(),
    description: text("description"),
    whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    address: text("address"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("stores_slug_idx").on(table.slug),
  })
);

/**
 * Tabel `store_members` memetakan akses multi-user (Pemilik, Kasir, Staf) ke sebuah toko UMKM.
 * Digunakan sebagai acuan otorisasi Row Level Security (RLS).
 */
export const storeMembers = pgTable(
  "store_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // Referensi ke auth.users.id
    role: memberRoleEnum("role").default("owner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    storeUserUniqueIdx: uniqueIndex("store_members_store_user_idx").on(
      table.storeId,
      table.userId
    ),
  })
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type StoreMember = typeof storeMembers.$inferSelect;
