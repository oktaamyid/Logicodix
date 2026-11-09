import { z } from "zod";

/**
 * Skema validasi pemesanan pelanggan dari Micro-Storefront Publik (Domain 2).
 */
export const createPublicOrderSchema = z.object({
  storeId: z.string().uuid("ID Toko tidak valid"),
  customerName: z
    .string()
    .trim()
    .min(2, "Nama pemesan minimal 2 karakter")
    .max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(
      /^(08|628)[0-9]{7,13}$/,
      "Nomor WhatsApp pemesan tidak valid (gunakan format 08... atau 628...)"
    ),
  customerAddress: z
    .string()
    .trim()
    .min(5, "Alamat pengiriman / catatan pengambilan minimal 5 karakter")
    .max(500),
  paymentMethod: z.enum(["qris", "bank_transfer", "cash"]),
  voucherCode: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(255).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive("Jumlah pesanan minimal 1"),
      })
    )
    .min(1, "Keranjang belanja tidak boleh kosong"),
});

/**
 * Skema validasi pembaruan status pesanan oleh pemilik/staf UMKM (Domain 2).
 */
export const updateOrderStatusSchema = z.object({
  storeId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]),
});

/**
 * Skema validasi pembuatan voucher diskon toko (Domain 2).
 */
export const createVoucherSchema = z.object({
  storeId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Kode voucher minimal 3 karakter")
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Kode voucher hanya boleh huruf kapital dan angka"),
  discountAmount: z
    .number()
    .int()
    .min(1000, "Nominal potongan minimal Rp 1.000"),
  minPurchase: z.number().int().min(0).default(0),
  quota: z.number().int().min(1, "Kuota minimal 1").default(50),
});

export type CreatePublicOrderInput = z.infer<typeof createPublicOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
