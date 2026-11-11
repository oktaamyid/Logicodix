import { redirect } from "next/navigation";

export default function DashboardIndexPage() {
  // Arahkan ke menu utama ringkasan usaha
  redirect("/dashboard/management/overview");
}
