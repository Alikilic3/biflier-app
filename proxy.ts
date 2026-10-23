import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Elke andere pagina vereist een ingelogde sessie, ongeacht rol.
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("van", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    // Alles behalve: API-routes, Next.js-interne assets, en statische
    // bestanden in public/ (herkenbaar aan hun extensie, bv. logo.svg,
    // favicon.ico, afbeeldingen, lettertypes). Die moeten altijd zonder
    // sessie-check en zonder redirect laden.
    "/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|woff2?|ttf)$|icon|apple-icon|icon-192|icon-512|manifest.webmanifest).*)",
  ],
};
