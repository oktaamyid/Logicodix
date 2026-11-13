import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { getExploreStoresAction } from "@/app/(market)/actions";
import { ExploreDirectory } from "@/components/market/ExploreDirectory";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    subsector?: string;
    city?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const result = await getExploreStoresAction({
    query: params.q,
    subsector: params.subsector,
    city: params.city,
  });

  const stores = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="font-semibold text-xs tracking-wide uppercase text-foreground">
              Direktori Ekonomi Kreatif Lokal ({stores.length} Toko)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="space-y-1.5 border-b border-border pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Pasar Karya Nusantara
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Eksplorasi UMKM Daerah
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Belanja langsung dari pengrajin kriya, produsen kopi, dan pelaku
            kuliner daerah melalui katalog resmi yang terhubung ke WhatsApp
            pemilik usaha.
          </p>
        </div>

        <ExploreDirectory initialStores={stores} />
      </main>
    </div>
  );
}
