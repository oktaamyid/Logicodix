import { redirect } from "next/navigation";
import { getActiveMerchantStore } from "@/app/dashboard/operational/actions";

export default async function DashboardIndexPage() {
  const activeRes = await getActiveMerchantStore();

  if (!activeRes.success) {
    redirect("/login");
  }

  const { userRole } = activeRes.data;

  if (userRole === "platform_admin") {
    redirect("/dashboard/admin");
  }

  if (userRole === "cashier") {
    redirect("/dashboard/operational/pos");
  }

  if (userRole === "staff") {
    redirect("/dashboard/operational/products");
  }

  redirect("/dashboard/management/overview");
}
