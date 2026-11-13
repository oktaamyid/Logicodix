"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, storeMembers, type Store, type StoreMember } from "@/lib/db/schema";
import {
  updateStoreSettingsSchema,
  addStoreMemberSchema,
  type UpdateStoreSettingsInput,
  type AddStoreMemberInput,
} from "@/lib/schemas/operational.schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import { getActiveMerchantStore } from "@/app/dashboard/operational/actions";
import {
  verifyStoreAccess,
  isPlatformAdminEmail,
} from "@/lib/supabase/auth-guard";

export interface EnrichedStoreMember extends StoreMember {
  email?: string;
  fullName?: string;
}

export interface StoreSettingsBundle {
  store: Store;
  members: EnrichedStoreMember[];
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

  if (!storeId) {
    return actionError(
      "Akun ini sedang berada dalam mode Admin Platform tanpa toko UMKM.",
      "STORE_NOT_FOUND"
    );
  }

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

  // Lengkapi data email & nama lengkap dari auth.users agar pemilik toko mudah mengenali staf
  const userMetaMap = new Map<string, { email: string; fullName?: string }>();
  if (members.length > 0) {
    try {
      const userIds = members.map((m) => m.userId);
      const rows = (await db.execute(
        sql`SELECT id::text AS id, email, raw_user_meta_data->>'full_name' AS full_name FROM auth.users WHERE id = ANY(ARRAY[${sql.join(
          userIds.map((id) => sql`${id}::uuid`),
          sql`, `
        )}])`
      )) as unknown as Array<{
        id: string;
        email: string | null;
        full_name: string | null;
      }>;

      for (const row of rows) {
        if (row.id && row.email) {
          userMetaMap.set(row.id, {
            email: row.email,
            fullName: row.full_name || undefined,
          });
        }
      }
    } catch {
      // Tetap tampilkan daftar anggota dengan UID jika lookup auth.users tidak tersedia
    }
  }

  const enrichedMembers: EnrichedStoreMember[] = members.map((m) => {
    const meta = userMetaMap.get(m.userId);
    return {
      ...m,
      email: meta?.email,
      fullName: meta?.fullName,
    };
  });

  return actionSuccess({
    store,
    members: enrichedMembers,
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
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
      bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : undefined,
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
 * Menambahkan karyawan / staf baru (Kasir POS atau Staf Gudang) ke dalam toko berdasarkan email akun terdaftar.
 */
export async function addStoreMemberAction(
  input: AddStoreMemberInput
): Promise<ActionResponse<EnrichedStoreMember>> {
  const parsed = addStoreMemberSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data karyawan tidak valid.",
      "VALIDATION_ERROR"
    );
  }

  const data = parsed.data;
  const normalizedEmail = data.email.trim().toLowerCase();

  if (isPlatformAdminEmail(normalizedEmail)) {
    return actionError(
      "Akun Admin Platform tidak dapat ditambahkan sebagai karyawan toko.",
      "FORBIDDEN"
    );
  }

  const access = await verifyStoreAccess(data.storeId, [
    "owner",
    "platform_admin",
  ]);
  if (!access.authorized) {
    return actionError(access.error, access.code);
  }

  // Cari user pada auth.users berdasarkan email
  const foundUsers = (await db.execute(
    sql`SELECT id::text AS id, email, raw_user_meta_data->>'full_name' AS full_name FROM auth.users WHERE lower(email) = ${normalizedEmail} LIMIT 1`
  )) as unknown as Array<{
    id: string;
    email: string;
    full_name: string | null;
  }>;

  const targetUser = foundUsers[0];
  if (!targetUser) {
    return actionError(
      `Akun dengan email "${normalizedEmail}" belum terdaftar. Minta karyawan Anda mendaftar akun terlebih dahulu di halaman Daftar Akun, lalu tambahkan kembali di sini.`,
      "USER_NOT_FOUND"
    );
  }

  if (access.store.ownerId === targetUser.id) {
    return actionError(
      "Pengguna tersebut sudah menjadi Pemilik Utama toko ini.",
      "ALREADY_OWNER"
    );
  }

  const existingMember = await db.query.storeMembers.findFirst({
    where: and(
      eq(storeMembers.storeId, data.storeId),
      eq(storeMembers.userId, targetUser.id)
    ),
  });

  if (existingMember) {
    return actionError(
      `Akun "${normalizedEmail}" sudah terdaftar di tim toko ini.`,
      "ALREADY_MEMBER"
    );
  }

  const [created] = await db
    .insert(storeMembers)
    .values({
      storeId: data.storeId,
      userId: targetUser.id,
      role: data.role,
    })
    .returning();

  revalidatePath("/dashboard/settings");

  return actionSuccess({
    ...created,
    email: targetUser.email,
    fullName: targetUser.full_name || undefined,
  });
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
        eq(storeMembers.storeId, input.storeId),
        ne(storeMembers.role, "owner")
      )
    )
    .returning();

  if (!updated) {
    return actionError("Data anggota staf tidak ditemukan.", "NOT_FOUND");
  }

  revalidatePath("/dashboard/settings");
  return actionSuccess(updated);
}

/**
 * Menghapus akses karyawan/staf dari toko.
 */
export async function removeStoreMemberAction(input: {
  storeId: string;
  memberId: string;
}): Promise<ActionResponse<{ deletedId: string }>> {
  const access = await verifyStoreAccess(input.storeId, [
    "owner",
    "platform_admin",
  ]);
  if (!access.authorized) {
    return actionError(access.error, access.code);
  }

  const [deleted] = await db
    .delete(storeMembers)
    .where(
      and(
        eq(storeMembers.id, input.memberId),
        eq(storeMembers.storeId, input.storeId),
        ne(storeMembers.role, "owner")
      )
    )
    .returning();

  if (!deleted) {
    return actionError(
      "Anggota staf tidak ditemukan atau tidak dapat dihapus.",
      "NOT_FOUND"
    );
  }

  revalidatePath("/dashboard/settings");
  return actionSuccess({ deletedId: deleted.id });
}
