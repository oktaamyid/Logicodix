"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, storeMembers, type Store, type StoreMember } from "@/lib/db/schema";
import {
  updateStoreSettingsSchema,
  type UpdateStoreSettingsInput,
} from "@/lib/schemas/operational.schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import { getActiveMerchantStore } from "@/app/dashboard/operational/actions";
import { verifyStoreAccess } from "@/lib/supabase/auth-guard";

export interface StoreSettingsBundle {
  store: Store;
  members: StoreMember[];
  currentUserEmail: string;
  currentUserRole: "owner" | "cashier" | "staff" | "platform_admin";
}

/**
 * Memuat profil lengkap toko beserta daftar anggota/staf toko untuk halaman Pengaturan.
 */
export async function getStoreSettingsDataAction(): Promise<
  ActionResponse<StoreSettingsBundle>
> {
  const activeRes = await getActiveMerchantStore();
  if (!activeRes.success) {
    return actionError(activeRes.error, activeRes.code);
  }

  const { storeId, userEmail, userRole } = activeRes.data;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });

  if (!store) {
    return actionError("Profil toko tidak ditemukan.", "STORE_NOT_FOUND");
  }

  const members = await db
    .select()
    .from(storeMembers)
    .where(eq(storeMembers.storeId, storeId));

  return actionSuccess({
    store,
    members,
    currentUserEmail: userEmail,
    currentUserRole: userRole,
  });
}

/**
 * Memperbarui profil dan konfigurasi operasional toko UMKM.
 */
export async function updateStoreSettingsAction(
  input: UpdateStoreSettingsInput
): Promise<ActionResponse<Store>> {
  const parsed = updateStoreSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data pengaturan toko tidak valid.",
      "VALIDATION_ERROR"
    );
  }

  const data = parsed.data;
  const access = await verifyStoreAccess(data.storeId, [
    "owner",
    "platform_admin",
  ]);
  if (!access.authorized) {
    return actionError(access.error, access.code);
  }

  // Pastikan slug tidak bentrok dengan toko lain
  const duplicateSlug = await db.query.stores.findFirst({
    where: and(eq(stores.slug, data.slug), ne(stores.id, data.storeId)),
  });

  if (duplicateSlug) {
    return actionError(
      `Slug "${data.slug}" sudah dipakai toko lain. Gunakan kombinasi nama lain.`,
      "SLUG_TAKEN"
    );
  }

  const [updated] = await db
    .update(stores)
    .set({
      name: data.name,
      slug: data.slug,
      subsector: data.subsector,
      whatsappNumber: data.whatsappNumber,
      city: data.city,
      address: data.address || null,
      description: data.description || null,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, data.storeId))
    .returning();

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/explore");
  revalidatePath(`/store/${updated.slug}`);

  return actionSuccess(updated);
}

/**
 * Mengubah peran anggota staf/kasir di dalam toko.
 */
export async function updateStoreMemberRoleAction(input: {
  storeId: string;
  memberId: string;
  role: "cashier" | "staff";
}): Promise<ActionResponse<StoreMember>> {
  const access = await verifyStoreAccess(input.storeId, [
    "owner",
    "platform_admin",
  ]);
  if (!access.authorized) {
    return actionError(access.error, access.code);
  }

  const [updated] = await db
    .update(storeMembers)
    .set({ role: input.role })
    .where(
      and(
        eq(storeMembers.id, input.memberId),
        eq(storeMembers.storeId, input.storeId)
      )
    )
    .returning();

  if (!updated) {
    return actionError("Data anggota staf tidak ditemukan.", "NOT_FOUND");
  }

  revalidatePath("/dashboard/settings");
  return actionSuccess(updated);
}
