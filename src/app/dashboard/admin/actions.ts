"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, storeMembers, products, orders, type Store } from "@/lib/db/schema";
import { verifyPlatformAdmin } from "@/lib/supabase/auth-guard";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";

export interface PlatformStoreRow {
  id: string;
  name: string;
  slug: string;
  subsector: string;
  city: string;
  whatsappNumber: string;
  isActive: boolean;
  createdAt: Date;
  productCount: number;
  memberCount: number;
  completedOrderCount: number;
  gmvAmount: number;
}

export interface SubsectorSummaryItem {
  subsector: string;
  storeCount: number;
  gmvAmount: number;
}

export interface PlatformAdminOverview {
  adminEmail: string;
  totalStores: number;
  activeStores: number;
  totalMembers: number;
  totalProducts: number;
  totalCompletedOrders: number;
  totalEcosystemGmv: number;
  subsectorSummary: SubsectorSummaryItem[];
  stores: PlatformStoreRow[];
}

/**
 * Mengambil ringkasan ekosistem lintas tenant untuk Panel Admin Platform (Superadmin).
 */
export async function getPlatformAdminOverviewAction(): Promise<
  ActionResponse<PlatformAdminOverview>
> {
  const adminCheck = await verifyPlatformAdmin();
  if (!adminCheck.authorized) {
    return actionError(adminCheck.error, "FORBIDDEN_ADMIN");
  }

  const [allStores, allProducts, allOrders, allMembers] = await Promise.all([
    db.select().from(stores).orderBy(desc(stores.createdAt)),
    db
      .select({
        id: products.id,
        storeId: products.storeId,
      })
      .from(products),
    db
      .select({
        id: orders.id,
        storeId: orders.storeId,
        status: orders.status,
        totalAmount: orders.totalAmount,
      })
      .from(orders),
    db
      .select({
        id: storeMembers.id,
        storeId: storeMembers.storeId,
      })
      .from(storeMembers),
  ]);

  const productCountByStore = new Map<string, number>();
  for (const prod of allProducts) {
    productCountByStore.set(
      prod.storeId,
      (productCountByStore.get(prod.storeId) ?? 0) + 1
    );
  }

  const memberCountByStore = new Map<string, number>();
  for (const mbr of allMembers) {
    memberCountByStore.set(
      mbr.storeId,
      (memberCountByStore.get(mbr.storeId) ?? 0) + 1
    );
  }

  const orderCountByStore = new Map<string, number>();
  const gmvByStore = new Map<string, number>();
  let totalCompletedOrders = 0;
  let totalEcosystemGmv = 0;

  for (const ord of allOrders) {
    if (ord.status === "completed") {
      totalCompletedOrders += 1;
      totalEcosystemGmv += ord.totalAmount;
      orderCountByStore.set(
        ord.storeId,
        (orderCountByStore.get(ord.storeId) ?? 0) + 1
      );
      gmvByStore.set(
        ord.storeId,
        (gmvByStore.get(ord.storeId) ?? 0) + ord.totalAmount
      );
    }
  }

  const storeRows: PlatformStoreRow[] = allStores.map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug,
    subsector: st.subsector,
    city: st.city,
    whatsappNumber: st.whatsappNumber,
    isActive: st.isActive,
    createdAt: st.createdAt,
    productCount: productCountByStore.get(st.id) ?? 0,
    memberCount: memberCountByStore.get(st.id) ?? 0,
    completedOrderCount: orderCountByStore.get(st.id) ?? 0,
    gmvAmount: gmvByStore.get(st.id) ?? 0,
  }));

  const subsectorMap = new Map<string, { storeCount: number; gmvAmount: number }>();
  for (const row of storeRows) {
    const cur = subsectorMap.get(row.subsector) ?? { storeCount: 0, gmvAmount: 0 };
    cur.storeCount += 1;
    cur.gmvAmount += row.gmvAmount;
    subsectorMap.set(row.subsector, cur);
  }

  const subsectorSummary: SubsectorSummaryItem[] = Array.from(
    subsectorMap.entries()
  )
    .map(([subsector, stats]) => ({
      subsector,
      storeCount: stats.storeCount,
      gmvAmount: stats.gmvAmount,
    }))
    .sort((a, b) => b.storeCount - a.storeCount || b.gmvAmount - a.gmvAmount);

  return actionSuccess({
    adminEmail: adminCheck.userEmail,
    totalStores: allStores.length,
    activeStores: allStores.filter((s) => s.isActive).length,
    totalMembers: allMembers.length,
    totalProducts: allProducts.length,
    totalCompletedOrders,
    totalEcosystemGmv,
    subsectorSummary,
    stores: storeRows,
  });
}

/**
 * Mengaktifkan atau menangguhkan status visibilitas toko UMKM pada direktori publik.
 */
export async function toggleStoreActiveAdminAction(input: {
  storeId: string;
  isActive: boolean;
}): Promise<ActionResponse<Store>> {
  const adminCheck = await verifyPlatformAdmin();
  if (!adminCheck.authorized) {
    return actionError(adminCheck.error, "FORBIDDEN_ADMIN");
  }

  const [updated] = await db
    .update(stores)
    .set({
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, input.storeId))
    .returning();

  if (!updated) {
    return actionError("Data toko tidak ditemukan.", "STORE_NOT_FOUND");
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/explore");
  revalidatePath(`/store/${updated.slug}`);

  return actionSuccess(updated);
}
