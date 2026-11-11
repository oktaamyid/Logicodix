import { notFound } from "next/navigation";
import { getStoreBySlugAction } from "@/app/(market)/actions";
import { StorefrontView } from "@/components/market/StorefrontView";

interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;

  const result = await getStoreBySlugAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const { store, products, vouchers } = result.data;

  return (
    <StorefrontView
      store={{
        id: store.id,
        name: store.name,
        slug: store.slug,
        subsector: store.subsector,
        description: store.description,
        city: store.city,
        whatsappNumber: store.whatsappNumber,
        address: store.address,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
      }}
      products={products}
      vouchers={vouchers}
    />
  );
}
