"use client";

import { useState } from "react";
import { TrendingUp, Package, Lightbulb } from "lucide-react";
import type { AnalyticsOverviewData } from "@/lib/actions/management/analytics";
import { RevenueTrendChart } from "@/components/management/RevenueTrendChart";
import { BEPForecastCards } from "@/components/management/BEPForecastCards";
import { MLAnalyticsPanel } from "@/components/management/MLAnalyticsPanel";
import { BusinessSmartInsights } from "@/components/management/BusinessSmartInsights";
import { InventoryAnalyticsCards } from "@/components/management/InventoryAnalyticsCards";
import { ManagementEmptyState } from "@/components/management/ManagementEmptyState";

interface AnalyticsWorkspaceProps {
  storeName: string;
  analytics: AnalyticsOverviewData;
  totalExpense: number;
  profitMarginPercent: number;
}

type AnalyticsTabId = "tren" | "produk" | "saran";

const TABS: {
  id: AnalyticsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "tren", label: "Tren & Target Modal", icon: TrendingUp },
  { id: "produk", label: "Kesehatan Stok & Produk", icon: Package },
  { id: "saran", label: "Perkiraan & Saran Toko", icon: Lightbulb },
];

export function AnalyticsWorkspace({
  storeName,
  analytics,
  totalExpense,
  profitMarginPercent,
}: AnalyticsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>("tren");

  const hasNoActivity =
    analytics.totalOrders === 0 && analytics.mlProductScores.length === 0;

  if (hasNoActivity) {
    return <ManagementEmptyState type="analytics" storeName={storeName} />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div
        role="tablist"
        aria-label="Pilih tampilan laporan penjualan dan stok"
        className="flex flex-wrap items-center gap-2 border-b border-border pb-3"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Tren Penjualan & Target Balik Modal */}
      {activeTab === "tren" && (
        <div className="space-y-6">
          {analytics.totalOrders === 0 ? (
            <ManagementEmptyState type="analytics" storeName={storeName} />
          ) : (
            <>
              <RevenueTrendChart trend={analytics.revenueTrend} />
              <BEPForecastCards
                totalRevenue={analytics.totalRevenue}
                totalCost={analytics.totalCost}
                totalExpense={totalExpense}
                totalOrders={analytics.totalOrders}
                profitMarginPercent={profitMarginPercent}
              />
            </>
          )}
        </div>
      )}

      {/* Tab 2: Kesehatan Stok & Prioritas Produk */}
      {activeTab === "produk" && (
        <div className="space-y-6">
          <InventoryAnalyticsCards
            fastMoving={analytics.fastMovingProducts}
            deadstock={analytics.deadstockProducts}
            restockAlerts={analytics.restockRecommendations}
          />
          <MLAnalyticsPanel
            forecast={analytics.mlForecast}
            productScores={analytics.mlProductScores}
            showForecast={false}
            showTable={true}
          />
        </div>
      )}

      {/* Tab 3: Perkiraan Penjualan & Saran Langkah Praktis */}
      {activeTab === "saran" && (
        <div className="space-y-6">
          <MLAnalyticsPanel
            forecast={analytics.mlForecast}
            productScores={analytics.mlProductScores}
            showForecast={true}
            showTable={false}
          />
          <BusinessSmartInsights
            deadstock={analytics.deadstockProducts}
            restockAlerts={analytics.restockRecommendations}
            profitMarginPercent={profitMarginPercent}
            averageOrderValue={analytics.averageOrderValue}
          />
        </div>
      )}
    </div>
  );
}
