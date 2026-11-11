import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  console.error("Error: Pastikan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan DATABASE_URL terisi di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sql = postgres(databaseUrl, { prepare: false });

async function main() {
  console.log("=== MEMBUAT AKUN SUPERADMIN NIAGARUPA ===");

  const adminEmail = "superadmin@niagarupa.id";
  const adminPassword = "SuperAdmin@Niagarupa2026!";
  const adminName = "Super Administrator Niagarupa";

  // 1. Cek atau Buat User di Supabase Auth
  const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Gagal membaca daftar pengguna:", listErr.message);
    process.exit(1);
  }

  let adminUser = usersList.users.find((u) => u.email === adminEmail);

  if (adminUser) {
    console.log(`Akun ${adminEmail} sudah ada. Memperbarui password dan status email...`);
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: "superadmin",
          is_superadmin: true,
        },
      }
    );
    if (updateErr) {
      console.error("Gagal update user:", updateErr.message);
      process.exit(1);
    }
    adminUser = updated.user;
  } else {
    console.log(`Membuat akun baru ${adminEmail}...`);
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: "superadmin",
        is_superadmin: true,
      },
    });
    if (createErr) {
      console.error("Gagal membuat user auth:", createErr.message);
      process.exit(1);
    }
    adminUser = created.user;
  }

  console.log(`✓ User Auth ID: ${adminUser.id}`);

  // 2. Cek atau Buat Toko Flagship / Demo di PostgreSQL
  const existingStores = await sql`SELECT id, slug, name FROM stores WHERE slug = 'kopi-seduh-nusantara'`;
  let storeId;

  if (existingStores.length > 0) {
    storeId = existingStores[0].id;
    console.log(`✓ Toko flagship sudah ada: ${existingStores[0].name} (${storeId})`);
    // Pastikan owner-nya adalah superadmin
    await sql`UPDATE stores SET owner_id = ${adminUser.id} WHERE id = ${storeId}`;
  } else {
    console.log("Membuat toko percontohan (Flagship Store: Kopi Seduh Nusantara)...");
    const [newStore] = await sql`
      INSERT INTO stores (
        owner_id, name, slug, subsector, whatsapp_number, city, address, description, is_active
      ) VALUES (
        ${adminUser.id},
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

  // 3. Pastikan relasi di store_members sebagai 'owner'
  const existingMember = await sql`
    SELECT id FROM store_members WHERE store_id = ${storeId} AND user_id = ${adminUser.id}
  `;

  if (existingMember.length === 0) {
    await sql`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES (${storeId}, ${adminUser.id}, 'owner')
    `;
    console.log("✓ Berhasil mengaitkan Superadmin sebagai Owner toko di store_members");
  } else {
    console.log("✓ Superadmin sudah terdaftar di store_members");
  }

  // 4. Tambahkan Kategori dan Produk Contoh jika belum ada
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
    console.log("✓ 4 Produk percontohan berhasil ditambahkan (lengkap dengan HPP dan stok)");
  } else {
    console.log(`✓ Produk sudah ada di toko (${existingProducts.length} produk)`);
  }

  console.log("\n=========================================");
  console.log("AKUN SUPERADMIN SIAP DIGUNAKAN:");
  console.log("Email    : " + adminEmail);
  console.log("Password : " + adminPassword);
  console.log("Login URL: http://localhost:3000/login");
  console.log("=========================================\n");

  await sql.end();
}

main().catch((err) => {
  console.error("Terjadi error:", err);
  process.exit(1);
});
