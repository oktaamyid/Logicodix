import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./core";
import { products } from "./operational";

/**
 * Kanal asal pesanan (Kasir POS fisik vs Storefront Online / WhatsApp).
 */
export const orderChannelEnum = pgEnum("order_channel", [
  "pos",
  "online_storefront",
  "whatsapp",
]);

/**
 * Status siklus hidup pesanan.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
]);

/**
 * Metode pembayaran yang didukung pada transaksi UMKM.
 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "qris",
  "bank_transfer",
]);

/**
 * Kupon promo/diskon yang dapat dibuat UMKM untuk meningkatkan akses pasar.
 */
export const vouchers = pgTable("vouchers", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 30 }).notNull(),
  discountAmount: integer("discount_amount").notNull(),
  minPurchase: integer("min_purchase").default(0).notNull(),
  quota: integer("quota").default(100).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Tabel `orders` menyatukan transaksi dari Kasir (POS) dan Storefront Online.
 * Menyimpan `totalCostAmount` (snapshot HPP) agar perhitungan laba kotor tetap akurat
 * meskipun harga modal produk berubah di masa mendatang.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderNumber: varchar("order_number", { length: 40 }).notNull(),
    channel: orderChannelEnum("channel").notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    customerName: varchar("customer_name", { length: 100 })
      .default("Pelanggan Umum")
      .notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }),
    customerAddress: text("customer_address"),
    subtotalAmount: integer("subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").default(0).notNull(),
    totalAmount: integer("total_amount").notNull(),
    totalCostAmount: integer("total_cost_amount").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method")
      .default("cash")
      .notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    orderNumberIdx: uniqueIndex("orders_order_number_idx").on(
      table.orderNumber
    ),
    storeStatusDateIdx: index("orders_store_status_date_idx").on(
      table.storeId,
      table.status,
      table.createdAt
    ),
  })
);

/**
 * Rincian item produk di dalam satu pesanan beserta snapshot harga jual & HPP saat transaksi.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productNameSnapshot: varchar("product_name_snapshot", {
      length: 150,
    }).notNull(),
    quantity: integer("quantity").notNull(),
    unitCostSnapshot: integer("unit_cost_snapshot").notNull(),
    unitPriceSnapshot: integer("unit_price_snapshot").notNull(),
    subtotal: integer("subtotal").notNull(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
  })
);

export type Voucher = typeof vouchers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
