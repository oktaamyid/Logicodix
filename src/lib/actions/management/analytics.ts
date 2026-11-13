"use server";

import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  products,
  categories,
  financialEntries,
  stores,
  stockMovements,
} from "@/lib/db/schema";

import {
  forecastRevenueHoltOLS,
  clusterProductsML,
  type RevenueForecastResult,
  type ProductMLScore,
} from "@/lib/ai/ml-engine";

export interface AnalyticsOverviewData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCost: number;
  grossProfit: number;
  fastMovingProducts: {
    id: string;
    name: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    currentStock: number;
  }[];
  deadstockProducts: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    costPrice: number;
    tiedUpCapital: number;
    daysInactive: number;
  }[];
  restockRecommendations: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    threshold: number;
    daysOfStockLeft: number;
    urgency: "critical" | "warning" | "normal";
  }[];
  revenueTrend: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
  mlForecast: RevenueForecastResult;
  mlProductScores: ProductMLScore[];
}

/**
 * Mengambil analitik penjualan mendalam, deteksi fast-moving, deadstock, dan rekomendasi restock.
 */
export async function getBusinessAnalytics(
  storeId: string,
  days: number | "all" = 30
): Promise<AnalyticsOverviewData> {
  let cutoffDate: Date | null = null;
  const numDays = days === "all" ? 90 : Number(days);

  if (days !== "all") {
    cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - numDays);
    cutoffDate.setHours(0, 0, 0, 0);
  }

  // 1. Data Pesanan Selesai dalam rentang waktu
  const orderConditions = [
    eq(orders.storeId, storeId),
    eq(orders.status, "completed"),
  ];
  if (cutoffDate) {
    orderConditions.push(gte(orders.completedAt, cutoffDate));
  }

  const orderStats = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      totalCost: sql<number>`coalesce(sum(${orders.totalCostAmount}), 0)`,
      orderCount: sql<number>`count(${orders.id})`,
    })
    .from(orders)
    .where(and(...orderConditions));

  const totalRevenue = Number(orderStats[0]?.totalRevenue || 0);
  const totalCost = Number(orderStats[0]?.totalCost || 0);
  const totalOrders = Number(orderStats[0]?.orderCount || 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const grossProfit = totalRevenue - totalCost;

  // 2. Trend Penjualan Harian (hingga 30 hari terakhir untuk grafik & model ML)
  const recentDays = Math.min(numDays, 30);
  const trendCutoff = new Date();
  trendCutoff.setDate(trendCutoff.getDate() - recentDays);

  const trendRows = await db
    .select({
      dateStr: sql<string>`to_char(${orders.completedAt}, 'YYYY-MM-DD')`,
      dayRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      dayOrders: sql<number>`count(${orders.id})`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        eq(orders.status, "completed"),
        gte(orders.completedAt, trendCutoff)
      )
    )
    .groupBy(sql`to_char(${orders.completedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.completedAt}, 'YYYY-MM-DD')`);

  const revenueTrend = trendRows.map((r) => ({
    date: r.dateStr,
    revenue: Number(r.dayRevenue || 0),
    orderCount: Number(r.dayOrders || 0),
  }));

  // 3. Ambil seluruh produk toko yang aktif
  const storeProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, storeId), eq(products.isActive, true)));

  // 4. Analisis Fast-Moving vs Deadstock melalui riwayat stock_movements (sale_pos & sale_online)
  const movementConditions = [
    eq(stockMovements.storeId, storeId),
    inArray(stockMovements.type, ["sale_pos", "sale_online"]),
  ];
  if (cutoffDate) {
    movementConditions.push(gte(stockMovements.createdAt, cutoffDate));
  }

  const salesMovements = await db
    .select({
      productId: stockMovements.productId,
      totalQuantitySold: sql<number>`abs(sum(${stockMovements.quantityChange}))`,
    })
    .from(stockMovements)
    .where(and(...movementConditions))
    .groupBy(stockMovements.productId);

  const salesMap = new Map<string, number>();
  salesMovements.forEach((s) => {
    salesMap.set(s.productId, Number(s.totalQuantitySold || 0));
  });

  // Fast-Moving Products: Urutkan produk dengan penjualan terbanyak
  const fastMovingProducts = storeProducts
    .map((p) => {
      const sold = salesMap.get(p.id) || 0;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: sold,
        revenue: sold * p.sellingPrice,
        currentStock: p.stockQuantity,
      };
    })
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Deadstock Products: Produk yang punya stok > 0 tetapi 0 penjualan dalam periode ini
  const deadstockProducts = storeProducts
    .filter((p) => {
      const sold = salesMap.get(p.id) || 0;
      return sold === 0 && p.stockQuantity > 0;
    })
    .map((p) => {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stockQuantity,
        costPrice: p.costPrice,
        tiedUpCapital: p.stockQuantity * p.costPrice, // Dana modal yang tertahan (idle capital)
        daysInactive: numDays,
      };
    })
    .sort((a, b) => b.tiedUpCapital - a.tiedUpCapital)
    .slice(0, 5);

  // Rekomendasi Restock & Days of Stock Left
  const restockRecommendations = storeProducts
    .map((p) => {
      const sold = salesMap.get(p.id) || 0;
      const dailyRunRate = sold > 0 ? sold / numDays : 0;
      const daysOfStockLeft =
        dailyRunRate > 0 ? Math.round(p.stockQuantity / dailyRunRate) : 999;

      let urgency: "critical" | "warning" | "normal" = "normal";
      if (p.stockQuantity <= Math.max(1, Math.floor(p.lowStockThreshold / 2))) {
        urgency = "critical";
      } else if (p.stockQuantity <= p.lowStockThreshold || daysOfStockLeft <= 5) {
        urgency = "warning";
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stockQuantity,
        threshold: p.lowStockThreshold,
        daysOfStockLeft,
        urgency,
      };
    })
    .filter((p) => p.urgency === "critical" || p.urgency === "warning")
    .sort((a, b) => {
      if (a.urgency === "critical" && b.urgency !== "critical") return -1;
      if (b.urgency === "critical" && a.urgency !== "critical") return 1;
      return a.daysOfStockLeft - b.daysOfStockLeft;
    })
    .slice(0, 5);

  // 5. Jalankan In-App ML Engine (Forecasting Holt+OLS & Klasterisasi Skor Produk)
  const mlForecast = forecastRevenueHoltOLS(revenueTrend);
  const mlProductScores = clusterProductsML(
    storeProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      unitsSold: salesMap.get(p.id) || 0,
    })),
    numDays
  );

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalCost,
    grossProfit,
    fastMovingProducts,
    deadstockProducts,
    restockRecommendations,
    revenueTrend,
    mlForecast,
    mlProductScores,
  };
}
