"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  financialEntries,
  orders,
  stores,
  storeMembers,
  type FinancialEntry,
} from "@/lib/db/schema";
import {
  recordExpenseSchema,
  analyticsPeriodFilterSchema,
  type RecordExpenseInput,
  type AnalyticsPeriodFilterInput,
} from "@/lib/schemas/management.schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import { verifyStoreAccess } from "@/lib/supabase/auth-guard";

/**
 * Mendapatkan store yang aktif untuk pengguna yang sedang login.
 */
export async function getCurrentUserStore(): Promise<
  ActionResponse<{ storeId: string; storeName: string; currency: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionError("Sesi login telah kedaluwarsa. Silakan login kembali.", "UNAUTHORIZED");
  }

  const membership = await db.query.storeMembers.findFirst({
    where: eq(storeMembers.userId, user.id),
    with: {
      // jika relasi di drizzle belum diset, query manual
    },
  });

  if (!membership) {
    // Cek apakah owner langsung di tabel stores
    const ownerStore = await db.query.stores.findFirst({
      where: eq(stores.ownerId, user.id),
    });

    if (!ownerStore) {
      return actionError("Profil toko belum ditemukan. Silakan selesaikan onboarding toko.", "STORE_NOT_FOUND");
    }

    return actionSuccess({
      storeId: ownerStore.id,
      storeName: ownerStore.name,
      currency: "IDR",
    });
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, membership.storeId),
  });

  if (!store) {
    return actionError("Toko tidak ditemukan", "STORE_NOT_FOUND");
  }

  return actionSuccess({
    storeId: store.id,
    storeName: store.name,
    currency: "IDR",
  });
}

/**
 * Mencatat pengeluaran operasional baru ke buku kas keuangan UMKM.
 */
export async function recordExpenseAction(
  input: RecordExpenseInput
): Promise<ActionResponse<{ id: string }>> {
  const parsed = recordExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data pengeluaran tidak valid",
      "VALIDATION_ERROR"
    );
  }

  const access = await verifyStoreAccess(parsed.data.storeId, [
    "owner",
    "staff",
    "platform_admin",
  ]);
  if (!access.authorized) {
    return actionError(access.error, access.code);
  }

  try {
    const [inserted] = await db
      .insert(financialEntries)
      .values({
        storeId: parsed.data.storeId,
        type: "expense",
        expenseCategory: parsed.data.expenseCategory,
        amount: Math.round(parsed.data.amount),
        description: parsed.data.description,
        transactionDate: parsed.data.transactionDate || new Date(),
        createdBy: access.userId,
      })
      .returning({ id: financialEntries.id });

    revalidatePath("/dashboard/management/finance");
    revalidatePath("/dashboard/management/overview");
    revalidatePath("/dashboard/management/analytics");

    return actionSuccess({ id: inserted.id });
  } catch (err: any) {
    return actionError(
      err?.message || "Gagal mencatat transaksi pengeluaran",
      "DATABASE_ERROR"
    );
  }
}

/**
 * Menghapus entri beban pengeluaran manual.
 */
export async function deleteFinancialEntryAction(
  storeId: string,
  entryId: string
): Promise<ActionResponse<null>> {
  try {
    await db
      .delete(financialEntries)
      .where(
        and(
          eq(financialEntries.id, entryId),
          eq(financialEntries.storeId, storeId)
        )
      );

    revalidatePath("/dashboard/management/finance");
    revalidatePath("/dashboard/management/overview");

    return actionSuccess(null);
  } catch (err: any) {
    return actionError("Gagal menghapus catatan transaksi.", "DATABASE_ERROR");
  }
}

export interface FinanceSummaryData {
  totalIncome: number;
  totalExpense: number;
  grossProfit: number;
  netProfit: number;
  totalOrdersCompleted: number;
  profitMarginPercent: number;
  breakdownByCategory: {
    category: string;
    label: string;
    amount: number;
    percentage: number;
  }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  raw_material: "Bahan Baku & Produksi",
  operational: "Operasional Toko",
  salary: "Gaji & Upah Karyawan",
  rent: "Sewa Tempat & Lahan",
  utilities: "Listrik, Air & Internet",
  marketing: "Iklan & Pemasaran",
  other: "Lain-lain",
};

/**
 * Mengambil ringkasan keuangan dan laba rugi UMKM.
 */
export async function getFinancialSummary(
  storeId: string,
  daysBack: number | "all" = 30
): Promise<FinanceSummaryData> {
  let startDate: Date | null = null;
  if (daysBack !== "all") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(daysBack));
    startDate.setHours(0, 0, 0, 0);
  }

  // 1. Hitung total pemasukan dan total HPP dari pesanan selesai (completed)
  const orderConditions = [
    eq(orders.storeId, storeId),
    eq(orders.status, "completed"),
  ];
  if (startDate) {
    orderConditions.push(gte(orders.completedAt, startDate));
  }

  const completedOrders = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      totalCost: sql<number>`coalesce(sum(${orders.totalCostAmount}), 0)`,
      orderCount: sql<number>`count(${orders.id})`,
    })
    .from(orders)
    .where(and(...orderConditions));

  const orderRevenue = Number(completedOrders[0]?.totalRevenue || 0);
  const orderHpp = Number(completedOrders[0]?.totalCost || 0);
  const totalOrdersCompleted = Number(completedOrders[0]?.orderCount || 0);

  // 2. Hitung pemasukan manual jika ada di financial_entries
  const manualConditions = [
    eq(financialEntries.storeId, storeId),
    eq(financialEntries.type, "income"),
  ];
  if (startDate) {
    manualConditions.push(gte(financialEntries.transactionDate, startDate));
  }

  const manualIncomes = await db
    .select({
      total: sql<number>`coalesce(sum(${financialEntries.amount}), 0)`,
    })
    .from(financialEntries)
    .where(and(...manualConditions));
  const totalManualIncome = Number(manualIncomes[0]?.total || 0);

  // Total Pemasukan = Penjualan Pesanan + Pemasukan Tambahan
  const totalIncome = orderRevenue + totalManualIncome;

  // Laba Kotor = Total Pemasukan - HPP Produk Terjual
  const grossProfit = totalIncome - orderHpp;

  // 3. Hitung seluruh beban pengeluaran operasional
  const expenseConditions = [
    eq(financialEntries.storeId, storeId),
    eq(financialEntries.type, "expense"),
  ];
  if (startDate) {
    expenseConditions.push(gte(financialEntries.transactionDate, startDate));
  }

  const expenses = await db
    .select({
      total: sql<number>`coalesce(sum(${financialEntries.amount}), 0)`,
    })
    .from(financialEntries)
    .where(and(...expenseConditions));
  const totalExpense = Number(expenses[0]?.total || 0);

  // Laba Bersih = Laba Kotor - Beban Operasional
  const netProfit = grossProfit - totalExpense;

  const profitMarginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // 4. Breakdown pengeluaran per kategori
  const categoryGrouped = await db
    .select({
      category: financialEntries.expenseCategory,
      total: sql<number>`coalesce(sum(${financialEntries.amount}), 0)`,
    })
    .from(financialEntries)
    .where(and(...expenseConditions))
    .groupBy(financialEntries.expenseCategory);

  const breakdownByCategory = categoryGrouped.map((item) => {
    const cat = item.category || "other";
    const amount = Number(item.total || 0);
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] || "Lainnya",
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    };
  });

  return {
    totalIncome,
    totalExpense,
    grossProfit,
    netProfit,
    totalOrdersCompleted,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    breakdownByCategory,
  };
}

/**
 * Mengambil daftar mutasi buku kas terbaru (gabungan pemasukan & pengeluaran).
 */
export async function getRecentTransactions(
  storeId: string,
  limit: number = 30
): Promise<FinancialEntry[]> {
  return await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.storeId, storeId))
    .orderBy(desc(financialEntries.transactionDate))
    .limit(limit);
}

