/**
 * In-App Machine Learning & Statistical Engine untuk Niagarupa.
 * Ditulis dalam TypeScript murni tanpa dependensi native sehingga 100% kompatibel
 * dengan Cloudflare Workers / Edge Runtime maupun Node.js.
 */

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueForecastResult {
  predictedNext7Days: number;
  predictedNext30Days: number;
  dailyExpectedBaseline: number;
  slopePerDay: number;
  confidenceScore: number; // 0 - 100 berbasis R-Squared & kecukupan sampel
  trendDirection: "growing" | "stable" | "declining";
  sampleDaysCount: number;
  algorithmLabel: string;
}

export interface ProductFeatureInput {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unitsSold: number;
}

export type ProductClusterLabel =
  | "Star Performer"
  | "Volume Driver"
  | "Stockout Risk"
  | "Capital Trap"
  | "Standard";

export interface ProductMLScore {
  id: string;
  name: string;
  sku: string;
  score: number; // 0 - 100
  cluster: ProductClusterLabel;
  dailyVelocity: number;
  marginPercent: number;
  tiedUpCapital: number;
  safeMaxDiscountPercent: number;
  recommendedAction: string;
}

export interface PricingTierRecommendation {
  tier: "Ekonomis" | "Optimal" | "Premium";
  sellingPrice: number;
  marginPercent: number;
  profitPerUnit: number;
  rationale: string;
}

/**
 * Membulatkan harga jual ke kelipatan Rp 500 terdekat (atau Rp 100 jika nominal kecil)
 * agar selaras dengan psikologi harga ritel Indonesia.
 */
function roundRetailPrice(rawPrice: number): number {
  if (rawPrice <= 5000) {
    return Math.max(500, Math.ceil(rawPrice / 100) * 100);
  }
  return Math.ceil(rawPrice / 500) * 500;
}

/**
 * Model 1: Prediksi Omzet Harian menggunakan Holt's Double Exponential Smoothing
 * yang digabungkan dengan Ordinary Least Squares (OLS) Linear Regression.
 */
export function forecastRevenueHoltOLS(
  series: DailyRevenuePoint[]
): RevenueForecastResult {
  const n = series.length;

  if (n === 0) {
    return {
      predictedNext7Days: 0,
      predictedNext30Days: 0,
      dailyExpectedBaseline: 0,
      slopePerDay: 0,
      confidenceScore: 0,
      trendDirection: "stable",
      sampleDaysCount: 0,
      algorithmLabel: "Holt's Exponential Smoothing + OLS Regression",
    };
  }

  const values = series.map((p) => p.revenue);

  if (n === 1) {
    const singleVal = Math.max(0, Math.round(values[0]));
    return {
      predictedNext7Days: singleVal * 7,
      predictedNext30Days: singleVal * 30,
      dailyExpectedBaseline: singleVal,
      slopePerDay: 0,
      confidenceScore: 25,
      trendDirection: "stable",
      sampleDaysCount: 1,
      algorithmLabel: "Holt's Exponential Smoothing + OLS Regression",
    };
  }

  // 1. Ordinary Least Squares (OLS) untuk mengukur slope tren & R-Squared
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const denominator = sumXX - n * meanX * meanX;
  const slope = denominator !== 0 ? (sumXY - n * meanX * meanY) / denominator : 0;
  const intercept = meanY - slope * meanX;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssTot += (values[i] - meanY) ** 2;
    ssRes += (values[i] - predicted) ** 2;
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  // 2. Holt's Double Exponential Smoothing (alpha = 0.4, beta = 0.2)
  const alpha = 0.4;
  const beta = 0.2;
  let level = values[0];
  let trend = values[1] - values[0];

  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Redam tren ekstrem agar proyeksi jangka menengah tetap realistis
  const dampedTrend = Math.max(-meanY * 0.15, Math.min(meanY * 0.15, trend * 0.5 + slope * 0.5));

  let forecast7 = 0;
  for (let h = 1; h <= 7; h++) {
    forecast7 += Math.max(0, level + h * dampedTrend);
  }

  let forecast30 = 0;
  for (let h = 1; h <= 30; h++) {
    // Terapkan faktor redaman logaritmik untuk horizon 30 hari
    const dampingFactor = h <= 7 ? h : 7 + (h - 7) * 0.5;
    forecast30 += Math.max(0, level + dampingFactor * dampedTrend);
  }

  // Penentuan arah tren relatif terhadap rata-rata harian
  const relativeSlope = meanY > 0 ? slope / meanY : 0;
  let trendDirection: "growing" | "stable" | "declining" = "stable";
  if (relativeSlope > 0.03) {
    trendDirection = "growing";
  } else if (relativeSlope < -0.03) {
    trendDirection = "declining";
  }

  // Skor kepercayaan gabungan antara kelengkapan sampel (maks 14 hari) dan R-Squared
  const sampleWeight = Math.min(1, n / 14);
  const confidenceScore = Math.round(
    Math.min(95, Math.max(20, sampleWeight * 55 + rSquared * 40))
  );

  return {
    predictedNext7Days: Math.round(forecast7),
    predictedNext30Days: Math.round(forecast30),
    dailyExpectedBaseline: Math.max(0, Math.round(level)),
    slopePerDay: Math.round(slope),
    confidenceScore,
    trendDirection,
    sampleDaysCount: n,
    algorithmLabel: "Holt's Exponential Smoothing + OLS Regression",
  };
}

/**
 * Model 2: Klasterisasi & Skoring Multi-Fitur SKU Produk (Min-Max Normalization).
 * Mengidentifikasi Produk Unggulan, Risiko Kehabisan Stok, dan Jebakan Modal Tertahan.
 */
export function clusterProductsML(
  items: ProductFeatureInput[],
  periodDays: number
): ProductMLScore[] {
  if (items.length === 0) return [];

  const safePeriod = Math.max(1, periodDays);

  const enriched = items.map((item) => {
    const dailyVelocity = item.unitsSold / safePeriod;
    const marginRatio =
      item.sellingPrice > 0
        ? Math.max(0, (item.sellingPrice - item.costPrice) / item.sellingPrice)
        : 0;
    const tiedUpCapital = item.stockQuantity * item.costPrice;
    const stockCoverageRatio =
      item.stockQuantity / Math.max(1, item.lowStockThreshold);

    return {
      ...item,
      dailyVelocity,
      marginRatio,
      tiedUpCapital,
      stockCoverageRatio,
    };
  });

  const maxVelocity = Math.max(...enriched.map((e) => e.dailyVelocity), 0.001);
  const maxMargin = Math.max(...enriched.map((e) => e.marginRatio), 0.001);
  const maxCapital = Math.max(...enriched.map((e) => e.tiedUpCapital), 1);

  return enriched
    .map((e) => {
      const normVelocity = e.dailyVelocity / maxVelocity;
      const normMargin = e.marginRatio / maxMargin;
      const normCapitalPenalty = e.tiedUpCapital / maxCapital;

      // Bobot komposit: 50% Kecepatan Jual + 35% Margin + 15% Efisiensi Modal
      const rawScore =
        normVelocity * 50 +
        normMargin * 35 +
        (1 - normCapitalPenalty) * 15;
      const score = Math.round(Math.min(100, Math.max(5, rawScore)));

      const marginPercent = Math.round(e.marginRatio * 1000) / 10;
      const safeMaxDiscountPercent = Math.max(
        0,
        Math.floor((e.marginRatio - 0.05) * 100)
      );

      let cluster: ProductClusterLabel = "Standard";
      let recommendedAction =
        "Pertahankan jumlah stok seperti biasa.";

      if (e.unitsSold > 0 && e.stockCoverageRatio <= 1.2) {
        cluster = "Stockout Risk";
        recommendedAction =
          "Segera tambah stok barang sebelum habis terjual di kasir.";
      } else if (normVelocity >= 0.5 && e.marginRatio >= 0.3) {
        cluster = "Star Performer";
        recommendedAction =
          "Pertahankan stok dan tampilkan di bagian atas etalase atau jadikan paket promo.";
      } else if (normVelocity >= 0.5) {
        cluster = "Volume Driver";
        recommendedAction =
          "Barang cepat laku tetapi untungnya tipis; cocok digabung dengan produk lain yang untungnya lebih besar.";
      } else if (e.unitsSold === 0 && e.tiedUpCapital > 0) {
        cluster = "Capital Trap";
        recommendedAction =
          safeMaxDiscountPercent >= 10
            ? `Beri diskon maksimal ${safeMaxDiscountPercent}% agar barang terjual dan uang modal kembali berputar.`
            : "Tawarkan sebagai bonus belanja minimal agar barang di gudang segera berkurang.";
      }

      return {
        id: e.id,
        name: e.name,
        sku: e.sku,
        score,
        cluster,
        dailyVelocity: Math.round(e.dailyVelocity * 100) / 100,
        marginPercent,
        tiedUpCapital: e.tiedUpCapital,
        safeMaxDiscountPercent,
        recommendedAction,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Model 3A: Rekomendasi 3 Tingkat Harga Jual Optimal berdasarkan HPP dan rata-rata margin toko.
 */
export function recommendPricingML(
  costPrice: number,
  existingMarginRatios: number[] = []
): PricingTierRecommendation[] {
  const safeCost = Math.max(100, costPrice);

  // Hitung median margin toko jika tersedia minimal 2 produk pembanding
  let baselineMargin = 0.35;
  const validMargins = existingMarginRatios.filter((m) => m > 0.05 && m < 0.85);
  if (validMargins.length >= 2) {
    const sorted = [...validMargins].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    baselineMargin = sorted[mid];
  }

  const targetMargins: {
    tier: "Ekonomis" | "Optimal" | "Premium";
    targetRatio: number;
    rationale: string;
  }[] = [
    {
      tier: "Ekonomis",
      targetRatio: Math.max(0.18, baselineMargin - 0.12),
      rationale: "Cocok untuk penetrasi pasar dan menarik pembeli pertama.",
    },
    {
      tier: "Optimal",
      targetRatio: baselineMargin,
      rationale:
        validMargins.length >= 2
          ? "Menyesuaikan median margin sehat dari katalog toko Anda."
          : "Keseimbangan standar antara daya beli dan margin keuntungan UMKM.",
    },
    {
      tier: "Premium",
      targetRatio: Math.min(0.7, baselineMargin + 0.15),
      rationale: "Direkomendasikan jika produk memiliki kemasan atau nilai keunikan tinggi.",
    },
  ];

  return targetMargins.map((cfg) => {
    const rawSelling = safeCost / (1 - cfg.targetRatio);
    const sellingPrice = roundRetailPrice(rawSelling);
    const profitPerUnit = sellingPrice - safeCost;
    const marginPercent = Math.round((profitPerUnit / sellingPrice) * 1000) / 10;

    return {
      tier: cfg.tier,
      sellingPrice,
      marginPercent,
      profitPerUnit,
      rationale: cfg.rationale,
    };
  });
}

/**
 * Model 3B: Penyusun Deskripsi Produk Terstruktur (Rule-Based NLG) tanpa panggilan API eksternal.
 */
export function generateProductDescriptionNLG(input: {
  name: string;
  categoryName?: string;
  unit?: string;
}): string {
  const cleanName = input.name.trim();
  if (!cleanName) {
    return "Produk pilihan UMKM lokal dengan kualitas terjaga dan siap kirim.";
  }

  const category = input.categoryName?.trim();
  const unit = input.unit?.trim() || "pcs";

  const categoryPhrase = category
    ? ` dalam kategori ${category}`
    : " dari pengrajin dan pelaku UMKM lokal";

  return `${cleanName} merupakan produk unggulan${categoryPhrase} yang dikemas per ${unit} dengan standar kualitas terjaga. Cocok untuk kebutuhan harian maupun buah tangan, tersedia untuk pembelian langsung di toko maupun pemesanan online.`;
}
