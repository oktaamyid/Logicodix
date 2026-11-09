import { z } from "zod";

/**
 * Skema validasi pencatatan beban pengeluaran operasional UMKM (Domain 3).
 */
export const recordExpenseSchema = z.object({
  storeId: z.string().uuid("ID Toko tidak valid"),
  expenseCategory: z.enum([
    "raw_material",
    "operational",
    "salary",
    "rent",
    "utilities",
    "marketing",
    "other",
  ]),
  amount: z
    .number()
    .int()
    .min(500, "Nominal pengeluaran minimal Rp 500"),
  description: z
    .string()
    .trim()
    .min(3, "Deskripsi pengeluaran minimal 3 karakter")
    .max(255),
  transactionDate: z.coerce.date().optional(),
});

/**
 * Skema filter rentang waktu laporan keuangan & analitik bisnis (Domain 3).
 */
export const analyticsPeriodFilterSchema = z.object({
  storeId: z.string().uuid(),
  period: z.enum(["7d", "30d", "90d", "custom"]).default("30d"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type RecordExpenseInput = z.infer<typeof recordExpenseSchema>;
export type AnalyticsPeriodFilterInput = z.infer<
  typeof analyticsPeriodFilterSchema
>;
