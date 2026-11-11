"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Store as StoreIcon, Sparkles, Package, ArrowRight } from "lucide-react";
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
    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");

    if (cityFilter) params.set("city", cityFilter);
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

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari toko atau produk ekonomi kreatif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="sm:col-span-4 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kota / Daerah (contoh: Bandung, Sleman)..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full h-10 font-medium">
              {isPending ? "Mencari..." : "Temukan"}
            </Button>
          </div>
        </form>

        {/* Subsector Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none text-xs">
          {SUBSECTORS.map((item) => {
            const isActive = currentSubsector === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSubsector(item.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Grid */}
      {initialStores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/50">
          <StoreIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
          <h3 className="font-semibold text-base">Belum Ada UMKM Ditemukan</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            Belum ada toko yang sesuai dengan kriteria pencarian Anda. Coba ubah kata kunci atau pilih subsektor lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialStores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all hover:border-primary/50 flex flex-col justify-between"
            >
              <div>
                {/* Store Cover / Banner */}
                <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/20 relative flex items-center justify-center p-4">
                  {store.bannerUrl ? (
                    <img
                      src={store.bannerUrl}
                      alt={store.name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-primary/40 font-semibold text-lg">
                      <Sparkles className="h-5 w-5" />
                      <span>{store.name}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs">
                    {store.subsector.toUpperCase()}
                  </div>
                </div>

                {/* Store Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-lg border bg-background shadow-xs flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
                      ) : (
                        store.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{store.city}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {store.description || "UMKM Ekonomi Kreatif terpercaya dengan karya & produk lokal berkualitas."}
                  </p>
                </div>
              </div>

              {/* Store Footer */}
              <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <strong className="text-foreground">{store.productCount}</strong> produk aktif
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

