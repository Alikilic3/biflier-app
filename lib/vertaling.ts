import type { Taal } from "@/lib/i18n";

// Geen "server-only": dit wordt zowel server- (activiteit-detailpagina) als
// client-side (AgendaView, detail-lade) gebruikt.
// Kiest het Turkse veld als de bezoeker Turks leest én er een vertaling is
// ingevuld; anders (of bij Nederlands) het Nederlandse veld.
export function vertaaldVeld(taal: Taal, nl: string, tr: string | null | undefined): string {
  return taal === "tr" && tr ? tr : nl;
}
