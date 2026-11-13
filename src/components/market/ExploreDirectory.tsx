"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Store as StoreIcon,
  Package,
  ArrowRight,
  LayoutGrid,
  Utensils,
  Shirt,
  Hammer,
  Palette,
  Camera,
  Drama,
  Music,
  BookOpen,
  Gamepad2,
  RotateCcw,
} from "lucide-react";
import { type StoreWithProductCount } from "@/app/(market)/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUBSECTORS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "Semua Sektor", icon: LayoutGrid },
  { id: "kuliner", label: "Kuliner", icon: Utensils },
  { id: "fashion", label: "Fesyen & Wastra", icon: Shirt },
  { id: "kriya", label: "Kriya & Kerajinan", icon: Hammer },
  { id: "desain", label: "Desain", icon: Palette },
  { id: "fotografi", label: "Fotografi", icon: Camera },
  { id: "seni_pertunjukan", label: "Seni Pertunjukan", icon: Drama },
  { id: "musik", label: "Musik", icon: Music },
  { id: "penerbitan", label: "Penerbitan", icon: BookOpen },
  { id: "aplikasi_game", label: "Aplikasi & Game", icon: Gamepad2 },
];

const SUBSECTOR_READABLE: Record<string, string> = {
  kuliner: "Kuliner & Pangan",
  fashion: "Fesyen & Wastra",
  kriya: "Kriya & Kerajinan",
  desain: "Desain Visual",
  fotografi: "Fotografi",
  seni_pertunjukan: "Seni Pertunjukan",
  musik: "Musik & Audio",
  penerbitan: "Penerbitan",
  aplikasi_game: "Aplikasi & Game",
  lainnya: "UMKM Lainnya",
};

interface ExploreDirectoryProps {
  initialStores: StoreWithProductCount[];
}

export function ExploreDirectory({ initialStores }: ExploreDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSubsector = searchParams.get("subsector") || "all";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    else params.delete("q");

    if (cityFilter.trim()) params.set("city", cityFilter.trim());
    else params.delete("city");

    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  const handleSelectSubsector = (subsectorId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subsectorId === "all") {
      params.delete("subsector");
    } else {
      params.set("subsector", subsectorId);
    }
    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("");
    startTransition(() => {
      router.push("/explore");
    });
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(cityFilter.trim()) ||
    currentSubsector !== "all";

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6 relative">
            <label htmlFor="explore-search" className="sr-only">
              Cari nama toko atau produk
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="explore-search"
              placeholder="Cari nama toko, kopi, batik, atau camilan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 min-h-[44px] text-sm"
            />
          </div>
          <div className="sm:col-span-4 relative">
            <label htmlFor="explore-city" className="sr-only">
              Filter berdasarkan kota atau kabupaten
            </label>
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="explore-city"
              placeholder="Semua kota (contoh: Bandung, Solo)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-10 min-h-[44px] text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full min-h-[44px] text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Mencari..." : "Cari Toko"}
            </Button>
          </div>
        </form>

        {/* Subsector Filter Buttons with Vector Icons */}
        <div
          role="tablist"
          aria-label="Filter kategori subsektor UMKM"
          className="flex items-center gap-2 overflow-x-auto pb-1 pt-1"
        >
          {SUBSECTORS.map((item) => {
            const Icon = item.icon;
            const isActive = currentSubsector === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectSubsector(item.id)}
                className={`inline-flex min-h-[40px] items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isActive ? "text-emerald-400" : "text-muted-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Result Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Menampilkan <strong className="text-foreground">{initialStores.length}</strong> toko
          UMKM terdaftar
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-[36px] items-center gap-1.5 text-primary hover:underline font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Hapus Filter Pencarian</span>
          </button>
        )}
      </div>

      {/* Store Directory Grid */}
      {initialStores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <StoreIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
          <h2 className="font-bold text-base text-foreground">
            Toko Tidak Ditemukan
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
            Belum ada mitra UMKM yang cocok dengan filter pencarian Anda. Coba
            gunakan kata kunci umum atau tampilkan seluruh kota.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-5 min-h-[44px] text-xs font-semibold"
            >
              Tampilkan Semua Toko
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialStores.map((store) => {
            const subsectorLabel =
              SUBSECTOR_READABLE[store.subsector] || store.subsector;
            return (
              <Link
                key={store.id}
                href={`/store/${store.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top Row: Avatar + Name + City + Subsector Tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl border border-border bg-emerald-50 flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          store.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-base text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                          {store.name}
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate font-medium">
                            {store.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground">
                      {subsectorLabel}
                    </span>
                  </div>

                  {/* Store Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {store.description ||
                      "Katalog produk resmi UMKM dengan pemesanan langsung melalui WhatsApp pemilik toko."}
                  </p>
                </div>

                {/* Footer Action Bar */}
                <div className="px-5 py-3.5 border-t border-border bg-secondary/30 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Package className="h-4 w-4 text-primary" />
                    <span>
                      <strong className="text-foreground">
                        {store.productCount}
                      </strong>{" "}
                      produk tersedia
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat Katalog</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
