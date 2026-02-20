import { NextRequest, NextResponse } from "next/server";

import { verifySessionToken } from "./src/lib/auth";

const AUTH_PATHS = new Set(["/login", "/register"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("fp_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthRoute = Array.from(AUTH_PATHS).some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) {
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
