import { createBrowserClient } from "@supabase/ssr";

/**
 * Membuat Supabase Client untuk Client Components ('use client').
 * Menggunakan cookie browser secara otomatis.
 */
export function createClient() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey
  );
}
