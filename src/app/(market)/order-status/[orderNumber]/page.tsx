import { notFound } from "next/navigation";
import { getPublicOrderDetailAction } from "@/app/(market)/actions";
import { OrderStatusTracker } from "@/components/market/OrderStatusTracker";

interface OrderStatusPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { orderNumber } = await params;

  const result = await getPublicOrderDetailAction(orderNumber);

  if (!result.success || !result.data) {
    notFound();
  }

  return <OrderStatusTracker data={result.data} />;
}

