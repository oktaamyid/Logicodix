interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground bg-card">
          Micro-Storefront Toko: <span className="font-semibold text-foreground">{slug}</span>
          <p className="mt-2 text-xs">Area Kerja Storefront Publik & Keranjang Belanja — PIC: Developer 2 (@pompomv)</p>
        </div>
      </main>
    </div>
  );
}
