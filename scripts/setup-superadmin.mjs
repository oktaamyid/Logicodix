import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = "sb_publishable_CkD1YWiW_QxyEV4o4hbhPg_4h50fyHO";
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !databaseUrl) {
  console.error("Database URL atau Supabase URL belum ada di .env.local");
  process.exit(1);
}

// 1. Update .env.local dengan publishable key yang valid
let envContent = fs.readFileSync(".env.local", "utf-8");
if (envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY="${publishableKey}"`
  );
} else {
  envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${publishableKey}"`;
}
fs.writeFileSync(".env.local", envContent);
console.log("✓ Berhasil memperbarui NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local");

const supabase = createClient(supabaseUrl, publishableKey);
const sql = postgres(databaseUrl, { prepare: false });

async function main() {
  const adminEmail = "superadmin.niagarupa@gmail.com";
  const adminPassword = "SuperAdmin@Niagarupa2026!";
  const adminName = "Super Administrator Niagarupa";

  console.log(`Mengonfirmasi akun ${adminEmail}...`);

  // Pastikan email sudah terkonfirmasi di PostgreSQL auth.users
  await sql`
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE email = ${adminEmail}
  `;
  console.log("✓ Email superadmin berhasil dikonfirmasi secara instan (email_confirmed_at aktif)");

  // Ambil ID user dari auth.users
  const [userRow] = await sql`
    SELECT id, email FROM auth.users WHERE email = ${adminEmail} LIMIT 1
  `;

  if (!userRow) {
    console.error("User tidak ditemukan di auth.users");
    process.exit(1);
  }

  const userId = userRow.id;
  console.log(`✓ User ID: ${userId}`);

  // Buat Toko Flagship / Demo di PostgreSQL
  const existingStores = await sql`SELECT id, slug, name FROM stores WHERE slug = 'kopi-seduh-nusantara'`;
  let storeId;

  if (existingStores.length > 0) {
    storeId = existingStores[0].id;
    console.log(`✓ Toko flagship sudah ada: ${existingStores[0].name} (${storeId})`);
    await sql`UPDATE stores SET owner_id = ${userId} WHERE id = ${storeId}`;
  } else {
    console.log("Membuat toko percontohan (Flagship Store: Kopi Seduh Nusantara)...");
    const [newStore] = await sql`
      INSERT INTO stores (
        owner_id, name, slug, subsector, whatsapp_number, city, address, description, is_active
      ) VALUES (
        ${userId},
        'Kopi Seduh Nusantara',
        'kopi-seduh-nusantara',
        'kuliner',
        '6281234567890',
        'Bandung',
        'Jl. Braga No. 42, Kota Bandung',
        'Roastery dan kedai kopi artisanal lokal yang menyajikan biji kopi pilihan langsung dari petani Nusantara.',
        true
      )
      RETURNING id, slug, name
    `;
    storeId = newStore.id;
    console.log(`✓ Toko berhasil dibuat: ${newStore.name} (${storeId})`);
  }

  // Kaitkan di store_members
  const existingMember = await sql`
    SELECT id FROM store_members WHERE store_id = ${storeId} AND user_id = ${userId}
  `;

  if (existingMember.length === 0) {
    await sql`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES (${storeId}, ${userId}, 'owner')
    `;
    console.log("✓ Superadmin dikaitkan sebagai 'owner' toko di store_members");
  } else {
    console.log("✓ Superadmin sudah terdaftar di store_members");
  }

  // Tambahkan Kategori dan Produk Contoh
  const existingProducts = await sql`SELECT id FROM products WHERE store_id = ${storeId}`;
  if (existingProducts.length === 0) {
    console.log("Menambahkan produk percontohan...");

    const [catKuliner] = await sql`
      INSERT INTO categories (store_id, name, slug)
      VALUES (${storeId}, 'Biji Kopi & Minuman', 'biji-kopi-minuman')
      RETURNING id
    `;

    const [catKriya] = await sql`
      INSERT INTO categories (store_id, name, slug)
      VALUES (${storeId}, 'Merchandise & Kerajinan', 'merchandise-kerajinan')
      RETURNING id
    `;

    await sql`
      INSERT INTO products (
        store_id, category_id, sku, name, description, cost_price, selling_price, stock_quantity, low_stock_threshold, unit, is_published, is_active
      ) VALUES
      (
        ${storeId}, ${catKuliner.id}, 'KOP-GAYO-250', 'Kopi Arabika Gayo Specialty 250g',
        'Single origin Arabika Gayo Aceh diproses wet-hulled dengan aroma rempah dan keasaman seimbang.',
        45000, 75000, 35, 5, 'pack', true, true
      ),
      (
        ${storeId}, ${catKuliner.id}, 'KOP-TEM-250', 'Kopi Robusta Temanggung Fine 250g',
        'Robusta lereng Gunung Sindoro dengan body tebal dan sentuhan rasa cokelat karamel.',
        25000, 45000, 50, 8, 'pack', true, true
      ),
      (
        ${storeId}, ${catKuliner.id}, 'MNM-V60-CUP', 'Manual Brew V60 Fresh Brew',
        'Seduhan kopi manual hangat dengan ekstraksi presisi untuk pecinta kopi murni.',
        8000, 25000, 100, 10, 'cup', true, true
      ),
      (
        ${storeId}, ${catKriya.id}, 'KRY-CBR-GRB', 'Cangkir Gerabah Keramik Etnik',
        'Kerajinan cangkir tanah liat bakar khas pengrajin lokal untuk menikmati seduhan kopi tradisional.',
        30000, 60000, 15, 3, 'pcs', true, true
      )
    `;
    console.log("✓ 4 Produk percontohan berhasil ditambahkan");
  }

  // 5. Verifikasi Login langsung dengan Supabase Auth
  console.log("Menguji coba proses login via Supabase Auth...");
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (loginErr) {
    console.error("Gagal login:", loginErr.message);
  } else {
    console.log("✓ UJI COBA LOGIN 100% SUKSES! Access Token diterima.");
  }

  console.log("\n=========================================");
  console.log("AKUN SUPERADMIN TELAH SIAP & AKTIF:");
  console.log("Email    : " + adminEmail);
  console.log("Password : " + adminPassword);
  console.log("Dashboard: http://localhost:3000/dashboard");
  console.log("Store    : http://localhost:3000/store/kopi-seduh-nusantara");
  console.log("=========================================\n");

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
