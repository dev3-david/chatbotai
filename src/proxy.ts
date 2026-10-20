import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

// Gate for /admin: the `authorized` callback in auth.config.ts runs first and
// redirects anonymous users to /login; this handles signed-in non-admins.
const adminGate = auth((req) => {
  if (req.auth?.user?.isAdmin !== true) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}) as unknown as NextMiddleware;

// Locale detection and prefixing for the customer-facing pages.
const intl = createIntlMiddleware(routing);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) return adminGate(request, event);
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) return NextResponse.next();
  return intl(request);
}

export const config = {
  // Everything except Next internals and files with an extension (favicon, images).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
