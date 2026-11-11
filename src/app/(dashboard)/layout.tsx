import Link from "next/link";
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Inbox,
  TicketPercent,
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="h-16 border-b flex items-center px-6 gap-2 font-bold text-lg text-primary">
          <Store className="h-5 w-5" />
          <span>Niagarupa Hub</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          {/* Domain 1: Operasional (Dev 1: @oktaamyid) */}
          <div>
            <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Operasional (POS)</span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">Dev 1</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/operational/pos"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted font-medium transition-colors"
              >
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <span>Kasir (Smart POS)</span>
              </Link>
              <Link
                href="/dashboard/operational/products"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Package className="h-4 w-4" />
                <span>Katalog Produk & HPP</span>
              </Link>
              <Link
                href="/dashboard/operational/inventory"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Layers className="h-4 w-4" />
                <span>Mutasi Stok & Opname</span>
              </Link>
            </div>
          </div>

          {/* Domain 2: Pasar & Order (Dev 2: @pompomv) */}
          <div>
            <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Akses Pasar</span>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">Dev 2</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Inbox className="h-4 w-4 text-blue-600" />
                <span>Pesanan Masuk</span>
              </Link>
              <Link
                href="/dashboard/orders/vouchers"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <TicketPercent className="h-4 w-4" />
                <span>Kupon Diskon Toko</span>
              </Link>
            </div>
          </div>

          {/* Domain 3: Bisnis & Analitik (Dev 3: @wildanfarizy) */}
          <div>
            <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Manajemen Bisnis</span>
              <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">Dev 3</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/management/overview"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-600" />
                <span>Ringkasan Usaha</span>
              </Link>
              <Link
                href="/dashboard/management/finance"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Wallet className="h-4 w-4" />
                <span>Buku Kas & Laba Rugi</span>
              </Link>
              <Link
                href="/dashboard/management/analytics"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Analitik & Deadstock</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* User / Store Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Lihat Etalase Publik</span>
          </Link>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-foreground text-sm sm:text-base">
              Merchant Workspace
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
