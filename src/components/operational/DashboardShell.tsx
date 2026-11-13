"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

interface DashboardShellProps {
  children: React.ReactNode;
  storeName: string;
  storeSlug: string;
  userEmail: string;
  userRole: "owner" | "cashier" | "staff" | "platform_admin";
}

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const ROLE_BADGE_MAP: Record<
  DashboardShellProps["userRole"],
  { text: string; className: string }
> = {
  owner: {
    text: "Pemilik Toko",
    className: "bg-emerald-100 text-emerald-900",
  },
  platform_admin: {
    text: "Admin Platform",
    className: "bg-slate-900 text-white",
  },
  cashier: {
    text: "Kasir",
    className: "bg-blue-100 text-blue-900",
  },
  staff: {
    text: "Staf",
    className: "bg-amber-100 text-amber-950",
  },
};

export function DashboardShell({
  children,
  storeName,
  storeSlug,
  userEmail,
  userRole,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  const navGroups: NavGroup[] = [
    {
      label: "Operasional & Inventori",
      items: [
        {
          href: "/dashboard/operational/pos",
          label: "Kasir (Smart POS)",
          icon: ShoppingCart,
        },
        {
          href: "/dashboard/operational/products",
          label: "Katalog Produk & HPP",
          icon: Package,
        },
        {
          href: "/dashboard/operational/inventory",
          label: "Mutasi Stok & Opname",
          icon: Layers,
        },
      ],
    },
    {
      label: "Etalase & Pesanan",
      items: [
        {
          href: "/dashboard/orders",
          label: "Pesanan Masuk",
          icon: Inbox,
        },
        {
          href: "/dashboard/orders/vouchers",
          label: "Kupon Diskon Toko",
          icon: TicketPercent,
        },
      ],
    },
    {
      label: "Keuangan & Analitik",
      items: [
        {
          href: "/dashboard/management/overview",
          label: "Ringkasan Usaha",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/management/finance",
          label: "Buku Kas & Laba Rugi",
          icon: Wallet,
        },
        {
          href: "/dashboard/management/analytics",
          label: "Analitik & Titik Impas",
          icon: TrendingUp,
        },
      ],
    },
    {
      label: "Konfigurasi & Otorisasi",
      items: [
        {
          href: "/dashboard/settings",
          label: "Pengaturan & Tim Toko",
          icon: Settings,
        },
        ...(userRole === "platform_admin"
          ? [
              {
                href: "/dashboard/admin",
                label: "Panel Admin Platform",
                icon: ShieldCheck,
              },
            ]
          : []),
      ],
    },
  ];

  const roleBadge = ROLE_BADGE_MAP[userRole];

  const sidebarContent = (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-5 shrink-0">
        <Link
          href="/dashboard/operational/pos"
          className="flex items-center gap-2.5 font-bold text-lg text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span className="tracking-tight text-foreground">Niagarupa</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Tutup menu navigasi"
          className="lg:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Store Identity Card */}
      <div className="border-b border-border bg-secondary/40 px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-foreground">
            {storeName}
          </p>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${roleBadge.className}`}
          >
            {roleBadge.text}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
          {userEmail || `/store/${storeSlug}`}
        </p>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Navigasi Dasbor UMKM"
        className="flex-1 overflow-y-auto p-4 space-y-6 text-sm"
      >
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-[44px] items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions: Storefront Link + Logout */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">
        <Link
          href={storeSlug ? `/store/${storeSlug}` : "/explore"}
          target="_blank"
          className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2 truncate">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Buka Etalase Publik</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Mengakhiri Sesi..." : "Keluar dari Akun"}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi"
            className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl"
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm sm:text-base truncate">
                {storeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <span>Direktori Pasar</span>
            </Link>
            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
              Kasir & Buku Kas Terhubung
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
