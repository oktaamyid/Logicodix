"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  stores,
  storeMembers,
  categories,
  products,
  stockMovements,
  orders,
  orderItems,
  financialEntries,
  type Product,
  type Category,
  type StockMovement,
} from "@/lib/db/schema";
import {
  upsertProductSchema,
  adjustStockSchema,
  posCheckoutSchema,
  createCategorySchema,
  type UpsertProductInput,
  type AdjustStockInput,
  type PosCheckoutInput,
  type CreateCategoryInput,
} from "@/lib/schemas/operational.schema";
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from "@/lib/types/action-response";
import { verifyStoreAccess } from "@/lib/supabase/auth-guard";

/**
 * Helper internal untuk mendapatkan ID store dari merchant yang sedang login.
 */
export async function getActiveMerchantStore(): Promise<
  ActionResponse<{
    storeId: string;
    storeName: string;
    storeSlug: string;
    userEmail: string;
    userRole: "owner" | "cashier" | "staff" | "platform_admin";
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionError(
      "Sesi login telah kedaluwarsa. Silakan login kembali.",
      "UNAUTHORIZED"
    );
  }

  const userEmail = user.email?.toLowerCase() || "";

  // 1. Cek keanggotaan store_members
  const member = await db.query.storeMembers.findFirst({
    where: eq(storeMembers.userId, user.id),
  });

  if (member) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, member.storeId),
    });
    if (store) {
      return actionSuccess({
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        userEmail,
        userRole:
          userEmail === "superadmin.niagarupa@gmail.com"
            ? "platform_admin"
            : member.role,
      });
    }
  }

  // 2. Cek kepemilikan langsung di stores
  const ownerStore = await db.query.stores.findFirst({
    where: eq(stores.ownerId, user.id),
  });

  if (ownerStore) {
    return actionSuccess({
      storeId: ownerStore.id,
      storeName: ownerStore.name,
      storeSlug: ownerStore.slug,
      userEmail,
      userRole:
        userEmail === "superadmin.niagarupa@gmail.com"
          ? "platform_admin"
          : "owner",
    });
  }

  return actionError(
    "Profil toko belum ditemukan. Silakan lakukan pendaftaran toko.",
    "STORE_NOT_FOUND"
  );
}

/**
 * Mendapatkan daftar kategori produk untuk suatu toko.
 */
export async function getCategoriesAction(
  storeId?: string
): Promise<ActionResponse<Category[]>> {
  try {
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const storeRes = await getActiveMerchantStore();
      if (!storeRes.success) return actionError(storeRes.error, storeRes.code);
      targetStoreId = storeRes.data.storeId;
    }

    const result = await db.query.categories.findMany({
      where: eq(categories.storeId, targetStoreId),
      orderBy: [categories.name],
    });

    return actionSuccess(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat kategori";
    return actionError(msg, "FETCH_ERROR");
  }
}

/**
 * Membuat kategori produk baru.
 */
export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResponse<Category>> {
  try {
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.errors[0]?.message || "Input kategori tidak valid",
        "VALIDATION_ERROR"
      );
    }

    const { storeId, name } = parsed.data;
    const access = await verifyStoreAccess(storeId, [
      "owner",
      "staff",
      "platform_admin",
    ]);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const [inserted] = await db
      .insert(categories)
      .values({
        storeId,
        name,
        slug: slug || `kategori-${Date.now()}`,
      })
      .returning();

    revalidatePath("/dashboard/operational/products");
    revalidatePath("/dashboard/operational/pos");

    return actionSuccess(inserted);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat kategori";
    return actionError(msg, "CREATE_CATEGORY_ERROR");
  }
}

/**
 * Mendapatkan daftar seluruh produk toko beserta nama kategorinya.
 */
export async function getProductsAction(storeId?: string): Promise<
  ActionResponse<
    Array<
      Product & {
        categoryName: string | null;
      }
    >
  >
> {
  try {
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const storeRes = await getActiveMerchantStore();
      if (!storeRes.success) return actionError(storeRes.error, storeRes.code);
      targetStoreId = storeRes.data.storeId;
    }

    const items = await db
      .select({
        id: products.id,
        storeId: products.storeId,
        categoryId: products.categoryId,
        sku: products.sku,
        name: products.name,
        description: products.description,
        imageUrl: products.imageUrl,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        unit: products.unit,
        isPublished: products.isPublished,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(eq(products.storeId, targetStoreId), eq(products.isActive, true))
      )
      .orderBy(desc(products.updatedAt));

    return actionSuccess(items);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat produk";
    return actionError(msg, "FETCH_ERROR");
  }
}

/**
 * Membuat produk baru atau memperbarui produk yang ada (Upsert).
 */
export async function upsertProductAction(
  input: UpsertProductInput
): Promise<ActionResponse<Product>> {
  try {
    const parsed = upsertProductSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.errors[0]?.message || "Data produk tidak valid",
        "VALIDATION_ERROR"
      );
    }

    const data = parsed.data;
    const access = await verifyStoreAccess(data.storeId, [
      "owner",
      "staff",
      "platform_admin",
    ]);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    if (data.id) {
      // Update produk eksisting
      const [existing] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, data.id), eq(products.storeId, data.storeId)))
        .limit(1);

      if (!existing) {
        return actionError("Produk tidak ditemukan", "NOT_FOUND");
      }

      // Jika stok diubah langsung dari form edit, catat mutasi stok
      const stockDiff = data.stockQuantity - existing.stockQuantity;

      const [updated] = await db
        .update(products)
        .set({
          categoryId: data.categoryId || null,
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
          unit: data.unit,
          isPublished: data.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(products.id, data.id))
        .returning();

      if (stockDiff !== 0) {
        await db.insert(stockMovements).values({
          storeId: data.storeId,
          productId: data.id,
          type: "adjustment",
          quantityChange: stockDiff,
          previousStock: existing.stockQuantity,
          currentStock: data.stockQuantity,
          notes: "Penyesuaian stok langsung dari formulir pengeditan produk",
        });
      }

      revalidatePath("/dashboard/operational/products");
      revalidatePath("/dashboard/operational/pos");
      revalidatePath("/dashboard/operational/inventory");
      revalidatePath("/explore");

      return actionSuccess(updated);
    } else {
      // Insert produk baru
      const [inserted] = await db
        .insert(products)
        .values({
          storeId: data.storeId,
          categoryId: data.categoryId || null,
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
          unit: data.unit,
          isPublished: data.isPublished,
          isActive: true,
        })
        .returning();

      // Catat mutasi stok awal jika stok > 0
      if (inserted.stockQuantity > 0) {
        await db.insert(stockMovements).values({
          storeId: data.storeId,
          productId: inserted.id,
          type: "initial",
          quantityChange: inserted.stockQuantity,
          previousStock: 0,
          currentStock: inserted.stockQuantity,
          notes: "Pencatatan stok awal saat produk baru didaftarkan",
        });
      }

      revalidatePath("/dashboard/operational/products");
      revalidatePath("/dashboard/operational/pos");
      revalidatePath("/dashboard/operational/inventory");
      revalidatePath("/explore");

      return actionSuccess(inserted);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan produk";
    return actionError(msg, "SAVE_PRODUCT_ERROR");
  }
}

/**
 * Menghapus produk (soft delete dengan isActive = false untuk menjaga integritas transaksi lampau).
 */
export async function deleteProductAction(
  productId: string,
  storeId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const access = await verifyStoreAccess(storeId, [
      "owner",
      "platform_admin",
    ]);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);

    if (!existing) {
      return actionError("Produk tidak ditemukan", "NOT_FOUND");
    }

    await db
      .update(products)
      .set({
        isActive: false,
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath("/dashboard/operational/products");
    revalidatePath("/dashboard/operational/pos");

    return actionSuccess({ id: productId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus produk";
    return actionError(msg, "DELETE_ERROR");
  }
}

/**
 * Mencatat mutasi stok manual (Restock, Opname/Penyesuaian, atau Barang Rusak).
 */
export async function adjustStockAction(
  input: AdjustStockInput
): Promise<ActionResponse<StockMovement>> {
  try {
    const parsed = adjustStockSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.errors[0]?.message || "Data mutasi stok tidak valid",
        "VALIDATION_ERROR"
      );
    }

    const { storeId, productId, type, quantityChange, notes } = parsed.data;
    const access = await verifyStoreAccess(storeId);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    // Eksekusi atomik menggunakan database transaction
    const movement = await db.transaction(async (tx) => {
      const [prod] = await tx
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
        .limit(1);

      if (!prod) {
        throw new Error("Produk tidak ditemukan di toko ini");
      }

      const previousStock = prod.stockQuantity;
      const currentStock = previousStock + quantityChange;

      if (currentStock < 0) {
        throw new Error(
          `Stok tidak mencukupi untuk pengurangan ini. Stok saat ini: ${previousStock}`
        );
      }

      // 1. Update stok produk
      await tx
        .update(products)
        .set({
          stockQuantity: currentStock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      // 2. Insert audit trail mutasi stok
      const [createdMovement] = await tx
        .insert(stockMovements)
        .values({
          storeId,
          productId,
          type,
          quantityChange,
          previousStock,
          currentStock,
          notes,
        })
        .returning();

      return createdMovement;
    });

    revalidatePath("/dashboard/operational/products");
    revalidatePath("/dashboard/operational/inventory");
    revalidatePath("/dashboard/operational/pos");

    return actionSuccess(movement);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal mencatat mutasi stok";
    return actionError(msg, "ADJUST_STOCK_ERROR");
  }
}

/**
 * Mendapatkan audit trail riwayat mutasi stok untuk suatu toko.
 */
export async function getStockMovementsAction(
  storeId?: string,
  productId?: string
): Promise<
  ActionResponse<
    Array<
      StockMovement & {
        productName: string;
        productSku: string;
      }
    >
  >
> {
  try {
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const storeRes = await getActiveMerchantStore();
      if (!storeRes.success) return actionError(storeRes.error, storeRes.code);
      targetStoreId = storeRes.data.storeId;
    }

    const queryConditions = [eq(stockMovements.storeId, targetStoreId)];
    if (productId) {
      queryConditions.push(eq(stockMovements.productId, productId));
    }

    const items = await db
      .select({
        id: stockMovements.id,
        storeId: stockMovements.storeId,
        productId: stockMovements.productId,
        type: stockMovements.type,
        quantityChange: stockMovements.quantityChange,
        previousStock: stockMovements.previousStock,
        currentStock: stockMovements.currentStock,
        referenceOrderId: stockMovements.referenceOrderId,
        notes: stockMovements.notes,
        createdBy: stockMovements.createdBy,
        createdAt: stockMovements.createdAt,
        productName: products.name,
        productSku: products.sku,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(and(...queryConditions))
      .orderBy(desc(stockMovements.createdAt))
      .limit(100);

    return actionSuccess(items);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal memuat mutasi stok";
    return actionError(msg, "FETCH_ERROR");
  }
}

export interface PosReceipt {
  orderId: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  paymentMethod: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

/**
 * Server Action Checkout Kasir Pintar (Smart POS).
 * Dijalankan dalam transaksi ACID penuh:
 * 1. Validasi ketersediaan stok semua item
 * 2. Pembuatan Order POS status 'completed'
 * 3. Pembuatan rincian OrderItems dengan snapshot HPP & harga jual
 * 4. Pengurangan stok produk secara atomik
 * 5. Pencatatan log mutasi stok type 'sale_pos'
 * 6. Pencatatan jurnal pemasukan otomatis ke financialEntries
 */
export async function posCheckoutAction(
  input: PosCheckoutInput
): Promise<ActionResponse<PosReceipt>> {
  try {
    const parsed = posCheckoutSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.errors[0]?.message || "Data checkout kasir tidak valid",
        "VALIDATION_ERROR"
      );
    }

    const { storeId, customerName, paymentMethod, discountAmount, notes, items } =
      parsed.data;

    const access = await verifyStoreAccess(storeId);
    if (!access.authorized) {
      return actionError(access.error, access.code);
    }

    const store = access.store;

    // Eksekusi ACID Transaction
    const receipt = await db.transaction(async (tx) => {
      // 1. Ambil data produk terkini dan validasi stok
      const productIds = items.map((i) => i.productId);
      const dbProducts = await tx
        .select()
        .from(products)
        .where(
          and(
            eq(products.storeId, storeId),
            sql`${products.id} IN ${productIds}`
          )
        );

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Validasi semua produk ada dan stok cukup
      for (const item of items) {
        const p = productMap.get(item.productId);
        if (!p) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }
        if (p.stockQuantity < item.quantity) {
          throw new Error(
            `Stok produk "${p.name}" tidak mencukupi (sisa: ${p.stockQuantity}, diminta: ${item.quantity})`
          );
        }
      }

      // 2. Hitung kalkulasi finansial
      let subtotalAmount = 0;
      let totalCostAmount = 0;
      const receiptItems: PosReceipt["items"] = [];

      for (const item of items) {
        const p = productMap.get(item.productId)!;
        const lineSubtotal = p.sellingPrice * item.quantity;
        const lineCost = p.costPrice * item.quantity;

        subtotalAmount += lineSubtotal;
        totalCostAmount += lineCost;

        receiptItems.push({
          name: p.name,
          quantity: item.quantity,
          price: p.sellingPrice,
          subtotal: lineSubtotal,
        });
      }

      const totalAmount = Math.max(0, subtotalAmount - discountAmount);

      // 3. Buat order number unik
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `POS-${dateStr}-${randomDigits}`;

      // 4. Insert ke tabel orders
      const [order] = await tx
        .insert(orders)
        .values({
          storeId,
          orderNumber,
          channel: "pos",
          status: "completed",
          customerName: customerName || "Pelanggan Umum",
          subtotalAmount,
          discountAmount,
          totalAmount,
          totalCostAmount,
          paymentMethod,
          notes: notes || null,
          completedAt: new Date(),
        })
        .returning();

      // 5. Insert order items & update stok & mutasi stok
      for (const item of items) {
        const p = productMap.get(item.productId)!;
        const lineSubtotal = p.sellingPrice * item.quantity;
        const previousStock = p.stockQuantity;
        const currentStock = previousStock - item.quantity;

        // a. Insert order item snapshot
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: p.id,
          productNameSnapshot: p.name,
          quantity: item.quantity,
          unitCostSnapshot: p.costPrice,
          unitPriceSnapshot: p.sellingPrice,
          subtotal: lineSubtotal,
        });

        // b. Kurangi stok produk
        await tx
          .update(products)
          .set({
            stockQuantity: currentStock,
            updatedAt: new Date(),
          })
          .where(eq(products.id, p.id));

        // c. Log mutasi stok
        await tx.insert(stockMovements).values({
          storeId,
          productId: p.id,
          type: "sale_pos",
          quantityChange: -item.quantity,
          previousStock,
          currentStock,
          referenceOrderId: order.id,
          notes: `Transaksi Kasir POS #${orderNumber}`,
        });
      }

      // 6. Pencatatan otomatis ke buku kas keuangan (financialEntries)
      await tx.insert(financialEntries).values({
        storeId,
        type: "income",
        expenseCategory: null,
        amount: totalAmount,
        description: `Penjualan Kasir POS #${orderNumber} (${customerName})`,
        referenceOrderId: order.id,
        transactionDate: new Date(),
      });

      const receiptData: PosReceipt = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: store.name,
        customerName: order.customerName,
        paymentMethod: order.paymentMethod,
        subtotalAmount: order.subtotalAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        items: receiptItems,
      };

      return receiptData;
    });

    revalidatePath("/dashboard/operational/products");
    revalidatePath("/dashboard/operational/pos");
    revalidatePath("/dashboard/operational/inventory");
    revalidatePath("/dashboard/management/overview");
    revalidatePath("/dashboard/management/finance");
    revalidatePath("/dashboard/management/analytics");

    return actionSuccess(receipt);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Terjadi kesalahan saat checkout kasir";
    return actionError(msg, "POS_CHECKOUT_ERROR");
  }
}
