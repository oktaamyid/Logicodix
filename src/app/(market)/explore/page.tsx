import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getExploreStoresAction } from "@/app/(market)/actions";
import { ExploreDirectory } from "@/components/market/ExploreDirectory";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    subsector?: string;
    city?: string;
    sort?: "latest" | "popular" | "products_count" | "name_asc";
    promo?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const result = await getExploreStoresAction({
    query: params.q,
    subsector: params.subsector,
    city: params.city,
    sortBy: params.sort,
    hasVoucherOnly: params.promo === "true",
  });

  const stores = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs tracking-wide uppercase text-muted-foreground">
              Direktori Ekonomi Kreatif Niagarupa
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Akses Pasar Digital UMKM Daerah
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Eksplorasi UMKM Daerah</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Dukung pertumbuhan ekonomi daerah dengan berbelanja langsung dari para pengrajin, produsen, dan pegiat ekonomi kreatif lokal di seluruh penjuru Indonesia.
          </p>
        </div>

        <ExploreDirectory initialStores={stores} />
      </main>
    </div>
  );
}
