"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { verifyStoreAccess } from "@/lib/supabase/auth-guard";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";

const BUCKET_NAME = "niagarupa-media";
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/**
 * Mengunggah gambar (Logo Toko, Banner Etalase, atau Foto Produk) ke Supabase Storage.
 * Otomatis memastikan bucket publik tersedia jika SUPABASE_SERVICE_ROLE_KEY dikonfigurasi.
 */
export async function uploadMediaImageAction(
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  try {
    const storeId = String(formData.get("storeId") || "").trim();
    const folderRaw = String(formData.get("folder") || "products").trim();
    const folder = folderRaw === "store" ? "store" : "products";
    const file = formData.get("file");

    if (!storeId) {
      return actionError("ID Toko tidak ditemukan.", "VALIDATION_ERROR");
    }

    const access = await verifyStoreAccess(storeId, [
      "owner",
      "staff",
      "platform_admin",
    ]);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    if (!(file instanceof File) || file.size === 0) {
      return actionError("Pilih file gambar terlebih dahulu.", "VALIDATION_ERROR");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return actionError(
        "Format gambar harus JPG, PNG, WebP, atau GIF.",
        "INVALID_FILE_TYPE"
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return actionError(
        "Ukuran gambar maksimal 3 MB. Kompres gambar terlebih dahulu.",
        "FILE_TOO_LARGE"
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const storageClient =
      supabaseUrl && serviceRoleKey
        ? createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : await createSupabaseServer();

    // Pastikan bucket publik sudah ada jika menggunakan service role
    if (supabaseUrl && serviceRoleKey) {
      const { data: buckets } = await storageClient.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        await storageClient.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE_BYTES,
          allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
        });
      }
    }

    const ext = getExtensionFromMime(file.type);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const filePath = `${storeId}/${folder}/${Date.now()}-${randomSuffix}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBytes, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return actionError(
        `Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}`,
        "UPLOAD_FAILED"
      );
    }

    const { data: publicUrlData } = storageClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return actionSuccess({ url: publicUrlData.publicUrl });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah gambar.";
    return actionError(msg, "UPLOAD_ERROR");
  }
}
