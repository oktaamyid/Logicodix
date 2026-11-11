import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-4">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="font-bold text-sm">Direktori UMKM & Ekonomi Kreatif Lokal</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eksplorasi UMKM Daerah</h1>
          <p className="text-sm text-muted-foreground">
            Temukan produk kreatif lokal unggulan dari berbagai sektor industri dan kota di Indonesia.
          </p>
        </div>

        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground bg-card">
          Area Kerja Direktori & Pencarian UMKM — PIC: Developer 2 (@pompomv)
        </div>
      </main>
    </div>
  );
}
