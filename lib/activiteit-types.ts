import type { Soort } from "@/lib/soort-types";

export const ZICHTBAARHEDEN = ["publiek", "leiding"] as const;
export type Zichtbaarheid = (typeof ZICHTBAARHEDEN)[number];

export type ActiviteitKort = {
  id: number;
  titel: string;
  titelTr: string | null;
  soort: Soort;
  start: Date;
  einde: Date;
  heleDag: boolean;
  locatie: string | null;
  locatieTr: string | null;
  zichtbaarheid: Zichtbaarheid;
};
