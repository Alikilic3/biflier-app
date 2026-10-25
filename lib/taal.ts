import "server-only";
import { cookies } from "next/headers";
import { TALEN, type Taal } from "@/lib/i18n";

// Cookie i.p.v. localStorage: zo kan de server de juiste taal al in de eerste
// HTML meegeven (geen flits van NL naar TR na hydratie), zie app/layout.tsx.
export const TAAL_COOKIE = "biflier_taal";

export async function huidigeTaal(): Promise<Taal> {
  const jar = await cookies();
  const waarde = jar.get(TAAL_COOKIE)?.value;
  return waarde && (TALEN as readonly string[]).includes(waarde) ? (waarde as Taal) : "nl";
}
