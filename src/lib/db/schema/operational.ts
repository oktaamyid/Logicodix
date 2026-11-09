import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./core";

/**
 * Jenis mutasi stok inventori untuk keperluan audit trail operasional.
 */
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "initial",
  "restock",
  "sale_pos",
  "sale_online",
  "adjustment",
  "damaged",
]);

/**
 * Kategori produk internal milik masing-masing toko UMKM.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    storeIdx: index("categories_store_idx").on(table.storeId),
  })
);

/**
 * Tabel `products` menyimpan katalog produk, Harga Pokok Penjualan (HPP / costPrice),
 * harga jual, serta stok aktual yang tersinkronisasi antara POS dan Storefront Publik.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    sku: varchar("sku", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    costPrice: integer("cost_price").default(0).notNull(), // HPP dalam Rupiah penuh
    sellingPrice: integer("selling_price").notNull(), // Harga jual dalam Rupiah penuh
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    unit: varchar("unit", { length: 20 }).default("pcs").notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    storeActiveIdx: index("products_store_active_idx").on(
      table.storeId,
      table.isActive
    ),
  })
);

/**
 * Tabel `stock_movements` merekam setiap perubahan jumlah stok produk
 * sehingga pemilik usaha dapat melacak riwayat barang masuk, terjual, maupun rusak.
 */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantityChange: integer("quantity_change").notNull(),
    previousStock: integer("previous_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    referenceOrderId: uuid("reference_order_id"),
    notes: text("notes"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productIdx: index("stock_movements_product_idx").on(table.productId),
  })
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
