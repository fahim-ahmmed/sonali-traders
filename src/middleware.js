import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC = ["/login"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  const hasSession = !!getSessionCookie(request);

  if (!hasSession && !PUBLIC.includes(pathname) && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // কুকি থাকলেই /login → /dashboard নয়: পুরনো/অবৈধ কুকিতে guard আবার /login-এ পাঠায় → অসীম লুপ।
  // সেশন বৈধ কি না তা (auth)/login/layout.js সার্ভারে যাচাই করে।
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"] };
