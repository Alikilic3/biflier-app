import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { onderhoudActief } from "@/lib/onderhoud";

const EIGENAAR_EMAIL = "mehmet@bif.be";

// Mag tijdens onderhoud altijd door: de inlogpagina zelf en de
// onderhoudspagina zelf (anders ontstaat een rewrite-loop). NextAuth-routes
// (/api/auth/*) en statische bestanden lopen al nooit door deze proxy, zie
// de matcher onderaan.
const ONDERHOUD_UITZONDERINGEN = ["/login", "/onderhoud"];

function isIcsPad(pathname: string): boolean {
  return pathname === "/agenda.ics" || /^\/agenda\/[^/]+\.ics$/.test(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ingelogd = !!req.auth;

  if (onderhoudActief() && !ingelogd && !ONDERHOUD_UITZONDERINGEN.includes(pathname)) {
    // .ics-feeds: enkel 503 teruggeven (geen HTML-rewrite) zodat agenda-apps
    // hun bestaande gegevens bewaren en later gewoon opnieuw proberen.
    if (isIcsPad(pathname)) {
      return new NextResponse(null, { status: 503, headers: { "Retry-After": "3600" } });
    }

    const url = req.nextUrl.clone();
    url.pathname = "/onderhoud";
    return NextResponse.rewrite(url, { status: 503, headers: { "Retry-After": "3600" } });
  }

  if (pathname === "/login") {
    if (ingelogd) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // /beheer vereist een sessie. De echte eigenaarscontrole gebeurt ook
  // server-side in elke action (lib/dal.ts: requireEigenaar), dit is enkel
  // voor een directe redirect i.p.v. een pagina laten renderen die daarna
  // alsnog weigert.
  if (pathname.startsWith("/beheer")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("van", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (req.auth.user?.email !== EIGENAAR_EMAIL) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
});

export const config = {
  // Alles behalve: API-routes (o.a. NextAuth), Next.js-interne assets, en
  // statische bestanden in public/ (logo, icons, manifest). Die moeten altijd
  // zonder sessie- of onderhoudscheck laden — anders laadt het logo niet
  // meer op de onderhoudspagina.
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|woff2?|ttf)$|icon|apple-icon|icon-192|icon-512|manifest.webmanifest).*)",
  ],
};
