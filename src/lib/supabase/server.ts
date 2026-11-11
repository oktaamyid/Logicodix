import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat Supabase Client untuk Server Components, Server Actions, dan Route Handlers.
 * Menyesuaikan dengan asynchronous cookies() di Next.js 15.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Dipanggil dari Server Component; cookie tidak bisa dimodifikasi di sini.
            // Ditangani melalui middleware.
          }
        },
      },
    }
  );
}
