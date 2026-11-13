import { getActiveMerchantStore } from "@/app/dashboard/operational/actions";
import { DashboardShell } from "@/components/operational/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeRes = await getActiveMerchantStore();

  const storeName = activeRes.success
    ? activeRes.data.storeName
    : "Ruang Kerja UMKM";
  const storeSlug = activeRes.success ? activeRes.data.storeSlug : "";
  const userEmail = activeRes.success ? activeRes.data.userEmail : "";
  const userRole = activeRes.success ? activeRes.data.userRole : "owner";
  const hasStore = activeRes.success ? Boolean(activeRes.data.hasStore) : false;

  return (
    <DashboardShell
      storeName={storeName}
      storeSlug={storeSlug}
      userEmail={userEmail}
      userRole={userRole}
      hasStore={hasStore}
    >
      {children}
    </DashboardShell>
  );
}
