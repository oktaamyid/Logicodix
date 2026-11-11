"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { stores, storeMembers } from "@/lib/db/schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import {
  loginSchema,
  registerSchema,
  storeOnboardingSchema,
  type LoginInput,
  type RegisterInput,
  type StoreOnboardingInput,
} from "@/lib/schemas/operational.schema";

/**
 * Server Action untuk proses login merchant menggunakan Supabase Auth.
 *
 * @param input - Payload email & password merchant
 * @returns ActionResponse dengan URL redirect yang sesuai (Onboarding vs Dashboard)
 */
export async function loginAction(
  input: LoginInput
): Promise<ActionResponse<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data login tidak valid",
      "VALIDATION_ERROR"
    );
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return actionError(
      error?.message || "Email atau password yang Anda masukkan salah",
      "AUTH_FAILED"
    );
  }

  // Periksa apakah pengguna sudah memiliki profil toko
  const memberRecord = await db.query.storeMembers.findFirst({
    where: eq(storeMembers.userId, data.user.id),
  });

  if (!memberRecord) {
    return actionSuccess({ redirectTo: "/onboarding" });
  }

  return actionSuccess({ redirectTo: "/dashboard" });
}

/**
 * Server Action untuk pendaftaran merchant baru.
 *
 * @param input - Nama lengkap, email, password, konfirmasi password
 * @returns ActionResponse dengan status registrasi
 */
export async function registerAction(
  input: RegisterInput
): Promise<ActionResponse<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data pendaftaran tidak valid",
      "VALIDATION_ERROR"
    );
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error || !data.user) {
    return actionError(
      error?.message || "Gagal membuat akun merchant baru",
      "SIGNUP_FAILED"
    );
  }

  return actionSuccess({ redirectTo: "/onboarding" });
}

/**
 * Server Action untuk proses onboarding UMKM (pembuatan profil toko pertama kali).
 * Mengaitkan pengguna aktif sebagai 'owner' toko.
 *
 * @param input - Data profil toko UMKM
 * @returns ActionResponse dengan ID toko dan slug yang berhasil dibuat
 */
export async function createStoreOnboardingAction(
  input: StoreOnboardingInput
): Promise<ActionResponse<{ storeId: string; slug: string }>> {
  const parsed = storeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.errors[0]?.message || "Data profil toko tidak valid",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError(
      "Sesi Anda telah kedaluwarsa. Silakan login kembali.",
      "UNAUTHORIZED"
    );
  }

  // Periksa keunikan slug toko
  const existingStore = await db.query.stores.findFirst({
    where: eq(stores.slug, parsed.data.slug),
  });

  if (existingStore) {
    return actionError(
      `Slug URL "${parsed.data.slug}" sudah digunakan oleh toko lain. Silakan pilih slug alternatif.`,
      "SLUG_TAKEN"
    );
  }

  try {
    const [newStore] = await db
      .insert(stores)
      .values({
        ownerId: user.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        subsector: parsed.data.subsector,
        whatsappNumber: parsed.data.whatsappNumber,
        city: parsed.data.city,
        address: parsed.data.address || null,
        description: parsed.data.description || null,
        isActive: true,
      })
      .returning({ id: stores.id, slug: stores.slug });

    if (!newStore) {
      return actionError("Gagal menyimpan data toko ke database", "DB_ERROR");
    }

    // Daftarkan user aktif sebagai owner di store_members
    await db.insert(storeMembers).values({
      storeId: newStore.id,
      userId: user.id,
      role: "owner",
    });

    revalidatePath("/dashboard");
    revalidatePath(`/store/${newStore.slug}`);

    return actionSuccess({
      storeId: newStore.id,
      slug: newStore.slug,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan toko";
    return actionError(errorMessage, "INTERNAL_ERROR");
  }
}

/**
 * Server Action untuk logout pengguna dari sesi Supabase.
 */
export async function logoutAction(): Promise<ActionResponse<null>> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return actionSuccess(null);
}
