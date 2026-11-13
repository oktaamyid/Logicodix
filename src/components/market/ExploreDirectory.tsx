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
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { type StoreWithProductCount } from "@/app/(market)/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUBSECTORS = [
  { id: "all", label: "Semua Sektor" },
  { id: "kuliner", label: "🍲 Kuliner" },
  { id: "fashion", label: "👗 Fashion" },
  { id: "kriya", label: "🪵 Kriya" },
  { id: "desain", label: "🎨 Desain" },
  { id: "fotografi", label: "📷 Fotografi" },
  { id: "seni_pertunjukan", label: "🎭 Seni Pertunjukan" },
  { id: "musik", label: "🎵 Musik" },
  { id: "penerbitan", label: "📚 Penerbitan" },
  { id: "aplikasi_game", label: "🎮 Aplikasi & Game" },
];

interface ExploreDirectoryProps {
  initialStores: StoreWithProductCount[];
}

export function ExploreDirectory({ initialStores }: ExploreDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSubsector = searchParams.get("subsector") || "all";
  const currentSort = searchParams.get("sort") || "latest";
  const currentPromo = searchParams.get("promo") === "true";

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "");

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      q: searchTerm.trim() || null,
      city: cityFilter.trim() || null,
    });
  };

  const handleSelectSubsector = (subsectorId: string) => {
    updateFilters({ subsector: subsectorId });
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
    currentSubsector !== "all" ||
    currentPromo ||
    currentSort !== "latest";

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari toko atau produk lokal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="sm:col-span-4 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kota / Daerah (contoh: Yogyakarta)..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 text-xs sm:text-sm font-semibold"
            >
              {isPending ? "Mencari..." : "Terapkan Pencarian"}
            </Button>
          </div>
        </form>

        {/* Subsector Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {SUBSECTORS.map((item) => {
            const isActive = currentSubsector === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSubsector(item.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? "bg-foreground text-background font-bold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Sort & Promo Toggles */}
        <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Urutkan:
            </span>
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="bg-muted px-2.5 py-1 rounded-md border text-xs font-medium focus:outline-hidden"
            >
              <option value="latest">Terbaru Terdaftar</option>
              <option value="products_count">Produk Terbanyak</option>
              <option value="name_asc">Nama Toko (A - Z)</option>
            </select>
          </div>

          <button
            onClick={() => updateFilters({ promo: currentPromo ? null : "true" })}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
              currentPromo
                ? "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5 text-amber-600" />
            <span>Ada Voucher Promo</span>
          </button>
        </div>
      </div>

      {/* Info Status Filter */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Menampilkan <strong>{initialStores.length}</strong> pelaku usaha kreatif
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-primary hover:underline font-semibold"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Directory Grid */}
      {initialStores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card">
          <StoreIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
          <h3 className="font-bold text-base">Belum Ada Usaha yang Cocok</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
            Tidak menemukan UMKM dengan kriteria pencarian saat ini. Silakan coba kata kunci lain atau bersihkan filter.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-4 text-xs"
            >
              Tampilkan Semua Toko
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialStores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group rounded-xl border bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner Sampul */}
                <div className="h-32 bg-muted relative flex items-center justify-center overflow-hidden">
                  {store.bannerUrl ? (
                    <img
                      src={store.bannerUrl}
                      alt={`Sampul ${store.name}`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                  ) : (
                    <div className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                      {store.name}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {store.hasActiveVoucher && (
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" /> PROMO
                      </span>
                    )}
                    <span className="bg-background/90 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border">
                      {store.subsector}
                    </span>
                  </div>
                </div>

                {/* Profil Usaha */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg border bg-background flex items-center justify-center text-primary font-bold text-base shrink-0 overflow-hidden">
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
                      <h3 className="font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{store.city}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {store.description ||
                      "Pelaku usaha ekonomi kreatif lokal dengan produk berkualitas dan berdaya saing."}
                  </p>
                </div>
              </div>

              {/* Footer Kartu */}
              <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>
                    <strong>{store.productCount}</strong> produk aktif
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                  Kunjungi Toko <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
