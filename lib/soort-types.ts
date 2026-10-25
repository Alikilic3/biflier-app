import type { Zichtbaarheid } from "@/lib/activiteit-types";

// Vast kleurenpalet voor soorten: 6 keuzes, donker/verzadigd genoeg voor
// witte tekst erop (chips en agenda-items gebruiken de kleur als achtergrond).
export const SOORT_KLEUREN = [
  "#0b853f", // groen
  "#1f5fbf", // blauw
  "#6d3fc0", // paars
  "#b45309", // amber
  "#be123c", // robijnrood
  "#0e7490", // teal
] as const;

export type Soort = {
  id: number;
  naamNl: string;
  naamTr: string;
  kleur: string;
  zichtbaarheid: Zichtbaarheid;
  kernSoort: boolean;
};

export function soortNaam(soort: Pick<Soort, "naamNl" | "naamTr">, taal: "nl" | "tr"): string {
  return taal === "tr" ? soort.naamTr : soort.naamNl;
}
