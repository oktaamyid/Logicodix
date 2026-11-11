import { createBrowserClient } from "@supabase/ssr";

/**
 * Membuat Supabase Client untuk Client Components ('use client').
 * Menggunakan cookie browser secara otomatis.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
