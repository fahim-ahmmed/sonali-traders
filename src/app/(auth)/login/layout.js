import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// শুধু বৈধ ও সক্রিয় সেশন হলে /dashboard-এ; পুরনো কুকি থাকলে লগইন ফর্মই দেখাবে
export default async function LoginLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user && session.user.active !== false) redirect("/dashboard");
  return children;
}
