import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { can } from "./permissions";

// পেজ-স্তরের সুরক্ষা (API-তে আলাদাভাবে আছেই)
export async function guard(permission) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user.active === false) redirect("/login");
  if (!can(user, permission)) redirect("/no-access");
  return user;
}
