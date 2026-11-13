import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { stores, storeMembers, type Store } from "@/lib/db/schema";

export const PLATFORM_ADMIN_EMAILS = ["superadmin.niagarupa@gmail.com"];

export type StoreAccessResult =
  | {
      authorized: true;
      userId: string;
      userEmail: string;
      role: "owner" | "cashier" | "staff" | "platform_admin";
      store: Store;
    }
  | {
      authorized: false;
      error: string;
      code: "UNAUTHORIZED" | "FORBIDDEN" | "STORE_NOT_FOUND";
    };

/**
 * Memastikan pengguna yang sedang login memiliki hak akses sah ke `storeId` terkait.
 * Mencegah celah IDOR (Insecure Direct Object Reference) pada Server Actions.
 */
export async function verifyStoreAccess(
  storeId: string,
  allowedRoles: Array<"owner" | "cashier" | "staff" | "platform_admin"> = [
    "owner",
    "cashier",
    "staff",
    "platform_admin",
  ]
): Promise<StoreAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Sesi login telah berakhir. Silakan masuk kembali.",
      code: "UNAUTHORIZED",
    };
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });

  if (!store) {
    return {
      authorized: false,
      error: "Toko tidak ditemukan.",
      code: "STORE_NOT_FOUND",
    };
  }

  const userEmail = user.email?.toLowerCase() || "";
  if (PLATFORM_ADMIN_EMAILS.includes(userEmail)) {
    return {
      authorized: true,
      userId: user.id,
      userEmail,
      role: "platform_admin",
      store,
    };
  }

  if (store.ownerId === user.id) {
    if (!allowedRoles.includes("owner")) {
      return {
        authorized: false,
        error: "Peran Anda tidak diizinkan melakukan tindakan ini.",
        code: "FORBIDDEN",
      };
    }
    return {
      authorized: true,
      userId: user.id,
      userEmail,
      role: "owner",
      store,
    };
  }

  const membership = await db.query.storeMembers.findFirst({
    where: and(
      eq(storeMembers.storeId, storeId),
      eq(storeMembers.userId, user.id)
    ),
  });

  if (!membership) {
    return {
      authorized: false,
      error: "Anda tidak memiliki hak akses ke toko ini.",
      code: "FORBIDDEN",
    };
  }

  if (!allowedRoles.includes(membership.role)) {
    return {
      authorized: false,
      error: `Tindakan ini memerlukan izin pemilik toko (peran Anda: ${membership.role}).`,
      code: "FORBIDDEN",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail,
    role: membership.role,
    store,
  };
}

/**
 * Memverifikasi apakah pengguna saat ini adalah Platform Superadmin.
 */
export async function verifyPlatformAdmin(): Promise<
  | { authorized: true; userId: string; userEmail: string }
  | { authorized: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, error: "Sesi login tidak ditemukan." };
  }

  const email = user.email?.toLowerCase() || "";
  if (!PLATFORM_ADMIN_EMAILS.includes(email)) {
    return {
      authorized: false,
      error: "Halaman ini khusus untuk Administrator Platform Niagarupa.",
    };
  }

  return { authorized: true, userId: user.id, userEmail: email };
}
