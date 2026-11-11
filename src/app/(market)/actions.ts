"use server";

import { db } from "@/lib/db";
import { stores, creativeSubsectorEnum } from "@/lib/db/schema/core";
import { products, categories } from "@/lib/db/schema/operational";
import { orders, orderItems, vouchers } from "@/lib/db/schema/market";
import {
  createPublicOrderSchema,
  updateOrderStatusSchema,
  createVoucherSchema,
  type CreatePublicOrderInput,
  type UpdateOrderStatusInput,
  type CreateVoucherInput,
} from "@/lib/schemas/market.schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import { eq, and, sql, ilike, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ExploreFilters {
  query?: string;
  subsector?: string;
  city?: string;
}

export interface StoreWithProductCount {
  id: string;
  name: string;
  slug: string;
  subsector: string;
  description: string | null;
  city: string;
  whatsappNumber: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  productCount: number;
}

/**
 * Mengambil daftar UMKM untuk direktori publik (/explore) dengan filter subsektor, pencarian nama/kota.
 */
export async function getExploreStoresAction(
  filters: ExploreFilters = {}
): Promise<ActionResponse<StoreWithProductCount[]>> {
  try {
    const conditions = [eq(stores.isActive, true)];

    if (filters.subsector && filters.subsector !== "all") {
      conditions.push(
        eq(
          stores.subsector,
          filters.subsector as (typeof creativeSubsectorEnum.enumValues)[number]
        )
      );
    }

    if (filters.city && filters.city.trim() !== "") {
      conditions.push(ilike(stores.city, `%${filters.city.trim()}%`));
    }

    if (filters.query && filters.query.trim() !== "") {
      const q = `%${filters.query.trim()}%`;
      conditions.push(
        sql`(${stores.name} ILIKE ${q} OR ${stores.description} ILIKE ${q})`
      );
    }

    const storeList = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        subsector: stores.subsector,
        description: stores.description,
        city: stores.city,
        whatsappNumber: stores.whatsappNumber,
        logoUrl: stores.logoUrl,
        bannerUrl: stores.bannerUrl,
        productCount: sql<number>`cast(count(${products.id}) as integer)`,
      })
      .from(stores)
      .leftJoin(
        products,
        and(
          eq(products.storeId, stores.id),
          eq(products.isActive, true),
          eq(products.isPublished, true)
        )
      )
      .where(and(...conditions))
      .groupBy(stores.id)
      .orderBy(desc(stores.createdAt));

    return actionSuccess(storeList);
  } catch (error) {
    console.error("[getExploreStoresAction] Error:", error);
    return actionError("Gagal memuat direktori UMKM.");
  }
}

/**
 * Mengambil detail toko dan katalog produk publik berdasarkan slug (/store/[slug]).
 */
export async function getStoreBySlugAction(slug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.slug, slug), eq(stores.isActive, true)),
    });

    if (!store) {
      return actionError("Toko tidak ditemukan atau sedang nonaktif.", "NOT_FOUND");
    }

    const storeProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        imageUrl: products.imageUrl,
        sellingPrice: products.sellingPrice,
        stockQuantity: products.stockQuantity,
        unit: products.unit,
        categoryId: products.categoryId,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.storeId, store.id),
          eq(products.isActive, true),
          eq(products.isPublished, true)
        )
      )
      .orderBy(desc(products.createdAt));

    const activeVouchers = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        discountAmount: vouchers.discountAmount,
        minPurchase: vouchers.minPurchase,
      })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.storeId, store.id),
          eq(vouchers.isActive, true),
          sql`(${vouchers.validUntil} IS NULL OR ${vouchers.validUntil} > NOW())`,
          sql`${vouchers.usedCount} < ${vouchers.quota}`
        )
      );

    return actionSuccess({
      store,
      products: storeProducts,
      vouchers: activeVouchers,
    });
  } catch (error) {
    console.error("[getStoreBySlugAction] Error:", error);
    return actionError("Gagal memuat profil toko.");
  }
}

/**
 * Membuat pesanan storefront publik dan mereturn nomor invoice + WhatsApp URL.
 */
export async function createPublicOrderAction(
  rawInput: CreatePublicOrderInput
): Promise<ActionResponse<{ orderNumber: string; whatsappUrl: string; totalAmount: number }>> {
  try {
    const parsed = createPublicOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return actionError(
        parsed.error.errors[0]?.message || "Data formulir pesanan tidak valid.",
        "VALIDATION_ERROR"
      );
    }
    const data = parsed.data;

    // 1. Ambil info toko
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, data.storeId), eq(stores.isActive, true)),
    });
    if (!store) {
      return actionError("Toko tidak ditemukan.", "STORE_NOT_FOUND");
    }

    // 2. Validasi produk & stok
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.storeId, store.id),
          eq(products.isActive, true)
        )
      );

    if (dbProducts.length !== productIds.length) {
      return actionError("Beberapa produk yang dipilih tidak valid atau sudah dihapus.", "INVALID_PRODUCT");
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotalAmount = 0;
    let totalCostAmount = 0;
    const orderItemsPayload: Array<{
      productId: string;
      productNameSnapshot: string;
      quantity: number;
      unitCostSnapshot: number;
      unitPriceSnapshot: number;
      subtotal: number;
    }> = [];

    for (const item of data.items) {
      const prod = productMap.get(item.productId)!;
      if (prod.stockQuantity < item.quantity) {
        return actionError(
          `Stok produk "${prod.name}" tidak mencukupi (sisa: ${prod.stockQuantity}).`,
          "OUT_OF_STOCK"
        );
      }
      const itemSubtotal = prod.sellingPrice * item.quantity;
      subtotalAmount += itemSubtotal;
      totalCostAmount += prod.costPrice * item.quantity;

      orderItemsPayload.push({
        productId: prod.id,
        productNameSnapshot: prod.name,
        quantity: item.quantity,
        unitCostSnapshot: prod.costPrice,
        unitPriceSnapshot: prod.sellingPrice,
        subtotal: itemSubtotal,
      });
    }

    // 3. Cek voucher jika ada
    let discountAmount = 0;
    let appliedVoucherId: string | null = null;
    if (data.voucherCode && data.voucherCode.trim() !== "") {
      const codeUpper = data.voucherCode.trim().toUpperCase();
      const voucher = await db.query.vouchers.findFirst({
        where: and(
          eq(vouchers.storeId, store.id),
          eq(vouchers.code, codeUpper),
          eq(vouchers.isActive, true)
        ),
      });

      if (voucher) {
        if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
          return actionError("Voucher promo sudah kedaluwarsa.", "VOUCHER_EXPIRED");
        }
        if (voucher.usedCount >= voucher.quota) {
          return actionError("Kuota voucher promo sudah habis.", "VOUCHER_QUOTA_FULL");
        }
        if (subtotalAmount < voucher.minPurchase) {
          return actionError(
            `Minimum belanja untuk menggunakan voucher ini adalah Rp ${voucher.minPurchase.toLocaleString("id-ID")}.`,
            "VOUCHER_MIN_PURCHASE"
          );
        }
        discountAmount = Math.min(voucher.discountAmount, subtotalAmount);
        appliedVoucherId = voucher.id;
      } else {
        return actionError("Kode voucher tidak valid untuk toko ini.", "INVALID_VOUCHER");
      }
    }

    const totalAmount = Math.max(0, subtotalAmount - discountAmount);

    // 4. Generate Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // 5. Simpan transaksi Order
    const [newOrder] = await db
      .insert(orders)
      .values({
        storeId: store.id,
        orderNumber,
        channel: "online_storefront",
        status: "pending",
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        subtotalAmount,
        discountAmount,
        totalAmount,
        totalCostAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      })
      .returning();

    // 6. Simpan item order
    await db.insert(orderItems).values(
      orderItemsPayload.map((item) => ({
        ...item,
        orderId: newOrder.id,
      }))
    );

    // 7. Update pemakaian voucher jika ada
    if (appliedVoucherId) {
      await db
        .update(vouchers)
        .set({ usedCount: sql`${vouchers.usedCount} + 1` })
        .where(eq(vouchers.id, appliedVoucherId));
    }

    // 8. Generate WhatsApp Message Link
    const cleanPhone = store.whatsappNumber.replace(/[^0-9]/g, "");
    const targetWa = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone.startsWith("+")
      ? cleanPhone.slice(1)
      : cleanPhone;

    const itemListText = orderItemsPayload
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.productNameSnapshot} x${i.quantity} (Rp ${i.subtotal.toLocaleString("id-ID")})`
      )
      .join("\n");

    const message = `Halo ${store.name}! 👋\nSaya ingin konfirmasi pesanan dari Toko Online Niagarupa:\n\n*No. Pesanan:* ${orderNumber}\n*Nama:* ${data.customerName}\n*Alamat/Catatan:* ${data.customerAddress}\n*Metode Bayar:* ${data.paymentMethod.toUpperCase()}\n\n*Rincian Pesanan:*\n${itemListText}\n\n*Subtotal:* Rp ${subtotalAmount.toLocaleString("id-ID")}\n*Diskon:* Rp ${discountAmount.toLocaleString("id-ID")}\n*Total Tagihan:* Rp ${totalAmount.toLocaleString("id-ID")}\n\nMohon petunjuk pembayaran & konfirmasinya ya kak. Terima kasih! 🙏`;

    const whatsappUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(message)}`;

    revalidatePath(`/store/${store.slug}`);
    revalidatePath("/orders");

    return actionSuccess({
      orderNumber,
      whatsappUrl,
      totalAmount,
    });
  } catch (error) {
    console.error("[createPublicOrderAction] Error:", error);
    return actionError("Terjadi kesalahan sistem saat memproses pesanan Anda.");
  }
}

/**
 * Mengambil daftar pesanan masuk untuk UMKM di dashboard (/orders).
 */
export async function getStoreOrdersAction(storeId: string) {
  try {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt));

    return actionSuccess(orderList);
  } catch (error) {
    console.error("[getStoreOrdersAction] Error:", error);
    return actionError("Gagal memuat daftar pesanan.");
  }
}

/**
 * Update status pesanan UMKM di dashboard (/orders).
 */
export async function updateOrderStatusAction(
  rawInput: UpdateOrderStatusInput
): Promise<ActionResponse<boolean>> {
  try {
    const parsed = updateOrderStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return actionError("Data status pesanan tidak valid.");
    }
    const { storeId, orderId, status } = parsed.data;

    await db
      .update(orders)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

    revalidatePath("/orders");
    return actionSuccess(true);
  } catch (error) {
    console.error("[updateOrderStatusAction] Error:", error);
    return actionError("Gagal memperbarui status pesanan.");
  }
}

/**
 * Mengambil daftar voucher toko (/orders/vouchers).
 */
export async function getStoreVouchersAction(storeId: string) {
  try {
    const list = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.storeId, storeId))
      .orderBy(desc(vouchers.createdAt));

    return actionSuccess(list);
  } catch (error) {
    console.error("[getStoreVouchersAction] Error:", error);
    return actionError("Gagal memuat kupon voucher.");
  }
}

/**
 * Membuat voucher diskon baru untuk toko (/orders/vouchers).
 */
export async function createVoucherAction(
  rawInput: CreateVoucherInput
): Promise<ActionResponse<boolean>> {
  try {
    const parsed = createVoucherSchema.safeParse(rawInput);
    if (!parsed.success) {
      return actionError(parsed.error.errors[0]?.message || "Data voucher tidak valid.");
    }
    const data = parsed.data;

    // Cek apakah kode sudah digunakan di toko ini
    const existing = await db.query.vouchers.findFirst({
      where: and(eq(vouchers.storeId, data.storeId), eq(vouchers.code, data.code)),
    });
    if (existing) {
      return actionError("Kode voucher ini sudah digunakan di toko Anda.");
    }

    await db.insert(vouchers).values({
      storeId: data.storeId,
      code: data.code,
      discountAmount: data.discountAmount,
      minPurchase: data.minPurchase,
      quota: data.quota,
      isActive: true,
    });

    revalidatePath("/orders/vouchers");
    return actionSuccess(true);
  } catch (error) {
    console.error("[createVoucherAction] Error:", error);
    return actionError("Gagal membuat voucher diskon.");
  }
}

