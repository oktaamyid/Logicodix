import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./core";
import { orders } from "./market";

/**
 * Tipe arus kas pada buku besar keuangan UMKM.
 */
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "income",
  "expense",
]);

/**
 * Kategori beban pengeluaran operasional UMKM untuk analisis struktur biaya.
 */
export const expenseCategoryEnum = pgEnum("expense_category", [
  "raw_material",
  "operational",
  "salary",
  "rent",
  "utilities",
  "marketing",
  "other",
]);

/**
 * Tabel `financial_entries` menyimpan jurnal pemasukan (otomatis dari POS/Order selesai
 * maupun manual) dan pengeluaran operasional untuk perhitungan Laba Bersih.
 */
export const financialEntries = pgTable(
  "financial_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    type: ledgerEntryTypeEnum("type").notNull(),
    expenseCategory: expenseCategoryEnum("expense_category"),
    amount: integer("amount").notNull(), // Nilai dalam Rupiah penuh
    description: varchar("description", { length: 255 }).notNull(),
    referenceOrderId: uuid("reference_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    transactionDate: timestamp("transaction_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    storeDateIdx: index("financial_entries_store_date_idx").on(
      table.storeId,
      table.transactionDate
    ),
  })
);

export type FinancialEntry = typeof financialEntries.$inferSelect;
export type NewFinancialEntry = typeof financialEntries.$inferInsert;
