import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") redirect("/pos"); // Dashboard শুধু Admin-এর
  return <DashboardClient />;
}
