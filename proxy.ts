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
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|icon-192|icon-512|manifest.webmanifest).*)",
  ],
};
