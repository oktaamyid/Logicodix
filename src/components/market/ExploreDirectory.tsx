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
      {/* Search & Filter Bar */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
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
              placeholder="Kota / Kabupaten (contoh: Yogyakarta)..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 text-xs sm:text-sm font-semibold"
            >
              {isPending ? "Mencari..." : "Terapkan"}
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
                  <div className="absolute top-3 right-3 bg-background/90 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border">
                    {store.subsector}
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
