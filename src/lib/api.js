import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth.js";
import { can } from "./permissions.js";

// সব API একই আকারের JSON: { ok, data | error }
export const ok = (data, status = 200) => NextResponse.json({ ok: true, data }, { status });
export const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// প্রতিটি রুটে: সেশন চেক → পারমিশন চেক
export async function requireUser(permission) {
  const user = await getSessionUser();
  if (!user) return { error: fail("লগইন করুন", 401) };
  if (permission && !can(user, permission)) return { error: fail("এই কাজের অনুমতি নেই", 403) };
  return { user };
}

// একাধিক পারমিশনের যেকোনো একটি থাকলেই চলবে (যেমন POS অথবা Customer List)
export async function requireAny(permissions) {
  const user = await getSessionUser();
  if (!user) return { error: fail("লগইন করুন", 401) };
  if (!permissions.some((p) => can(user, p))) return { error: fail("এই কাজের অনুমতি নেই", 403) };
  return { user };
}
