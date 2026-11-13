import { z } from "zod";

export const CREATIVE_SUBSECTORS = [
  "kuliner",
  "kriya",
  "fashion",
  "desain",
  "seni_pertunjukan",
  "fotografi",
  "musik",
  "penerbitan",
  "aplikasi_game",
  "lainnya",
] as const;

/**
 * Skema validasi untuk login merchant (Domain 1).
 */
export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

/**
 * Skema validasi untuk registrasi merchant baru (Domain 1).
 */
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter"),
    email: z.string().trim().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

/**
 * Skema validasi untuk pendaftaran / onboarding toko UMKM baru (Domain 1).
 */
export const storeOnboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama toko minimal 3 karakter")
    .max(120, "Nama toko maksimal 120 karakter"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug URL minimal 3 karakter")
    .max(140)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"
    ),
  subsector: z.enum([
    "kuliner",
    "kriya",
    "fashion",
    "desain",
    "seni_pertunjukan",
    "fotografi",
    "musik",
    "penerbitan",
    "aplikasi_game",
    "lainnya",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^628[0-9]{7,13}$/,
      "Nomor WhatsApp wajib diawali 628 (contoh: 6281234567890)"
    ),
  city: z.string().trim().min(2, "Nama kota/kabupaten wajib diisi").max(80),
  address: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
});

/**
 * Skema validasi pembuatan atau pembaruan produk UMKM (Domain 1).
 */
export const upsertProductSchema = z
  .object({
    id: z.string().uuid().optional(),
    storeId: z.string().uuid("ID Toko tidak valid"),
    categoryId: z.string().uuid().nullable().optional(),
    sku: z
      .string()
      .trim()
      .min(2, "SKU minimal 2 karakter")
      .max(50, "SKU maksimal 50 karakter"),
    name: z
      .string()
      .trim()
      .min(2, "Nama produk minimal 2 karakter")
      .max(150, "Nama produk maksimal 150 karakter"),
    description: z.string().trim().max(1000).optional(),
    imageUrl: z.string().url("URL gambar tidak valid").nullable().optional(),
    costPrice: z
      .number()
      .int()
      .min(0, "Harga modal (HPP) tidak boleh negatif"),
    sellingPrice: z
      .number()
      .int()
      .min(100, "Harga jual minimal Rp 100"),
    stockQuantity: z.number().int().min(0, "Stok awal tidak boleh negatif"),
    lowStockThreshold: z
      .number()
      .int()
      .min(0, "Batas stok minimum tidak boleh negatif")
      .default(5),
    unit: z.string().trim().min(1).max(20).default("pcs"),
    isPublished: z.boolean().default(true),
  })
  .refine((data) => data.sellingPrice >= data.costPrice, {
    message:
      "Harga jual sebaiknya tidak lebih rendah dari Harga Pokok Penjualan (HPP)",
    path: ["sellingPrice"],
  });

/**
 * Skema validasi penyesuaian stok manual / restock / barang rusak (Domain 1).
 */
export const adjustStockSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(["restock", "adjustment", "damaged"]),
  quantityChange: z
    .number()
    .int()
    .refine((val) => val !== 0, "Perubahan jumlah stok tidak boleh 0"),
  notes: z
    .string()
    .trim()
    .min(3, "Catatan mutasi stok wajib diisi (minimal 3 karakter)")
    .max(255),
});

/**
 * Skema validasi transaksi Checkout Kasir / Smart POS (Domain 1).
 */
export const posCheckoutSchema = z.object({
  storeId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(100).default("Pelanggan Umum"),
  paymentMethod: z.enum(["cash", "qris", "bank_transfer"]),
  discountAmount: z.number().int().min(0).default(0),
  notes: z.string().trim().max(255).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive("Jumlah item minimal 1"),
      })
    )
    .min(1, "Keranjang kasir tidak boleh kosong"),
});

/**
 * Skema validasi pembuatan kategori produk baru (Domain 1).
 */
export const createCategorySchema = z.object({
  storeId: z.string().uuid("ID Toko tidak valid"),
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(80, "Nama kategori maksimal 80 karakter"),
});

/**
 * Skema validasi pembaruan pengaturan profil toko UMKM.
 */
export const updateStoreSettingsSchema = z.object({
  storeId: z.string().uuid("ID Toko tidak valid"),
  name: z
    .string()
    .trim()
    .min(3, "Nama toko minimal 3 karakter")
    .max(120, "Nama toko maksimal 120 karakter"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug URL minimal 3 karakter")
    .max(140)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"
    ),
  subsector: z.enum([
    "kuliner",
    "kriya",
    "fashion",
    "desain",
    "seni_pertunjukan",
    "fotografi",
    "musik",
    "penerbitan",
    "aplikasi_game",
    "lainnya",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^628[0-9]{7,13}$/,
      "Nomor WhatsApp wajib diawali 628 (contoh: 6281234567890)"
    ),
  city: z.string().trim().min(2, "Nama kota/kabupaten wajib diisi").max(80),
  address: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
  logoUrl: z.string().url("URL logo tidak valid").nullable().optional(),
  bannerUrl: z.string().url("URL banner tidak valid").nullable().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Skema validasi penambahan anggota / staf toko UMKM berdasarkan email akun.
 */
export const addStoreMemberSchema = z.object({
  storeId: z.string().uuid("ID Toko tidak valid"),
  email: z.string().trim().email("Format email staf tidak valid"),
  role: z.enum(["cashier", "staff"]),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
export type AddStoreMemberInput = z.infer<typeof addStoreMemberSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StoreOnboardingInput = z.infer<typeof storeOnboardingSchema>;
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;
