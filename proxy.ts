import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const EIGENAAR_EMAIL = "mehmet@bif.be";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // /beheer vereist een sessie. De echte eigenaarscontrole gebeurt ook
  // server-side in elke action (lib/dal.ts: requireEigenaar), dit is enkel
  // voor een directe redirect i.p.v. een pagina laten renderen die daarna
  // alsnog weigert.
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("van", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth.user?.email !== EIGENAAR_EMAIL) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  // Enkel /beheer en /login zijn ooit achter een sessie-check: de rest van
  // de site (agenda, activiteitdetails, .ics-feeds, statische bestanden) is
  // publiek en loopt dus nooit door deze middleware.
  matcher: ["/beheer/:path*", "/login"],
};
