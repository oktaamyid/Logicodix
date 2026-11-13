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

export const metadata = {
  title: "Direktori Toko & Katalog UMKM | Niagarupa",
  description:
    "Temukan dan pesan produk langsung dari pemilik toko UMKM kuliner, kriya, dan fesyen lokal melalui WhatsApp.",
};

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
      {/* Header Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Beranda</span>
            </Link>
            <span className="text-border">|</span>
            <Link href="/" className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm text-foreground">
                Niagarupa
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Daftarkan Toko Anda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Direktori Toko & Katalog UMKM
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Pilih toko untuk melihat daftar harga produk, menggunakan kupon
              diskon, dan memesan langsung ke nomor WhatsApp pemilik usaha.
            </p>
          </div>
        </div>

        <ExploreDirectory initialStores={stores} />
      </main>
    </div>
  );
}
