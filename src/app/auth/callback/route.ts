import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/lib/supabase/auth-guard";
import { db } from "@/lib/db";
import { storeMembers } from "@/lib/db/schema";

/**
 * Route Handler untuk OAuth Callback Supabase (Google Auth).
 * Menukar authorization code dengan sesi pengguna dan mengarahkan
 * ke /onboarding jika belum memiliki toko, atau ke /dashboard jika sudah ada.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (isPlatformAdminEmail(data.user.email)) {
        return NextResponse.redirect(`${origin}/dashboard/admin`);
      }

      // Periksa apakah pengguna sudah memiliki toko di tabel store_members
      const memberRecord = await db.query.storeMembers.findFirst({
        where: eq(storeMembers.userId, data.user.id),
      });

      // Jika belum terdaftar di toko manapun, arahkan ke onboarding wizard
      if (!memberRecord) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Lindungi dari open-redirect: pastikan next berupa path relatif
      const isRelative = next.startsWith("/") && !next.startsWith("//");
      const targetUrl = isRelative ? `${origin}${next}` : `${origin}/dashboard`;
      return NextResponse.redirect(targetUrl);
    }
  }

  // Jika kode tidak valid atau pertukaran sesi gagal, arahkan kembali ke login dengan pesan error
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  );
}
