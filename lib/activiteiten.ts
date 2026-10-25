import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActiviteitKort } from "@/lib/activiteit-types";

export * from "@/lib/activiteit-types";

const SOORT_SELECT = {
  id: true,
  naamNl: true,
  naamTr: true,
  kleur: true,
  zichtbaarheid: true,
  kernSoort: true,
} as const;

const ACTIVITEIT_SELECT = {
  id: true,
  titel: true,
  titelTr: true,
  soort: { select: SOORT_SELECT },
  start: true,
  einde: true,
  heleDag: true,
  locatie: true,
  locatieTr: true,
  zichtbaarheid: true,
} as const;

// Een activiteit is publiek zichtbaar als zowel de activiteit zelf als haar
// soort op "publiek" staat — een soort op "alleen leiding" (bv. "Vergadering")
// verbergt dus automatisch al haar activiteiten voor uitgelogde bezoekers,
// ook als een activiteit zelf per ongeluk op "publiek" zou staan.
const PUBLIEK_FILTER = { zichtbaarheid: "publiek", soort: { zichtbaarheid: "publiek" } } as const;

async function fetchActiviteiten(metLeiding: boolean): Promise<ActiviteitKort[]> {
  const rijen = await prisma.activiteit.findMany({
    where: metLeiding ? {} : PUBLIEK_FILTER,
    orderBy: { start: "asc" },
    select: ACTIVITEIT_SELECT,
  });

  return rijen as ActiviteitKort[];
}

// unstable_cache persisteert naar schijf via JSON, waardoor Date-velden op
// een cache-hit als platte strings teruggegeven worden (geen Date-instanties
// meer). Elke cache-laag zet start/einde hier daarom terug om naar echte
// Date-objecten, zodat callers (o.a. AgendaView's toLocaleDateString, en
// ics.ts's toISOString) altijd een echte Date krijgen, cache-hit of niet.
function reviveData<T extends { start: Date | string; einde: Date | string }>(a: T): T {
  return { ...a, start: new Date(a.start), einde: new Date(a.einde) };
}

const getActiviteitenPubliekCached = unstable_cache(
  () => fetchActiviteiten(false),
  ["activiteiten", "publiek"],
  { revalidate: 3600, tags: ["activiteiten"] }
);

const getActiviteitenMetLeidingCached = unstable_cache(
  () => fetchActiviteiten(true),
  ["activiteiten", "met-leiding"],
  { revalidate: 3600, tags: ["activiteiten"] }
);

// Gecachet en getagd: elke schrijfactie op de agenda (zie
// app/beheer/agenda/actions.ts) roept updateTag("activiteiten") aan.
// PT1H-fallback (3600s) voor het geval een revalidatie ooit gemist wordt.
export async function getActiviteitenPubliek(): Promise<ActiviteitKort[]> {
  const rijen = await getActiviteitenPubliekCached();
  return rijen.map(reviveData);
}

export async function getActiviteitenMetLeiding(): Promise<ActiviteitKort[]> {
  const rijen = await getActiviteitenMetLeidingCached();
  return rijen.map(reviveData);
}

export function getActiviteiten(metLeiding: boolean) {
  return metLeiding ? getActiviteitenMetLeiding() : getActiviteitenPubliek();
}

export type ActiviteitVoorIcs = ActiviteitKort & { beschrijving: string | null };

async function fetchActiviteitenVoorIcs(): Promise<ActiviteitVoorIcs[]> {
  const rijen = await prisma.activiteit.findMany({
    where: PUBLIEK_FILTER,
    orderBy: { start: "asc" },
    select: { ...ACTIVITEIT_SELECT, beschrijving: true },
  });

  return rijen as ActiviteitVoorIcs[];
}

const getActiviteitenVoorIcsCached = unstable_cache(
  fetchActiviteitenVoorIcs,
  ["activiteiten", "ics"],
  { revalidate: 3600, tags: ["activiteiten"] }
);

// Enkel publieke activiteiten: de .ics-feed is onauthenticatie en dus altijd
// de publieke variant, net als de rest van de agenda voor uitgelogde
// bezoekers.
export async function getActiviteitenVoorIcs(): Promise<ActiviteitVoorIcs[]> {
  const rijen = await getActiviteitenVoorIcsCached();
  return rijen.map(reviveData);
}

async function fetchActiviteitVoorIcs(id: number): Promise<ActiviteitVoorIcs | null> {
  const rij = await prisma.activiteit.findFirst({
    where: { id, ...PUBLIEK_FILTER },
    select: { ...ACTIVITEIT_SELECT, beschrijving: true },
  });

  return rij as ActiviteitVoorIcs | null;
}

const getActiviteitVoorIcsCached = unstable_cache(
  fetchActiviteitVoorIcs,
  ["activiteit", "ics"],
  { revalidate: 3600, tags: ["activiteiten"] }
);

export async function getActiviteitVoorIcs(id: number): Promise<ActiviteitVoorIcs | null> {
  const rij = await getActiviteitVoorIcsCached(id);
  return rij ? reviveData(rij) : null;
}

// Zet een "YYYY-MM-DDTHH:mm"-string zoals <input type="datetime-local">
// teruggeeft (bedoeld als Brussels/lokale tijd) om naar het juiste UTC-instant,
// rekening houdend met zomer-/wintertijd. Geen libraries nodig: we gokken een
// UTC-instant, kijken hoe dat in Europe/Brussels zou weergeven, en corrigeren
// het verschil.
export function brusselsNaarUtc(dateTimeLocal: string): Date {
  const [datumDeel, tijdDeel] = dateTimeLocal.split("T");
  const [jaar, maand, dag] = datumDeel.split("-").map(Number);
  const [uur, minuut] = tijdDeel.split(":").map(Number);

  const gok = new Date(Date.UTC(jaar, maand - 1, dag, uur, minuut));

  const delen = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(gok);

  const waarde = (type: string) => Number(delen.find((d) => d.type === type)?.value ?? 0);
  const alsUtc = Date.UTC(
    waarde("year"),
    waarde("month") - 1,
    waarde("day"),
    waarde("hour") === 24 ? 0 : waarde("hour"),
    waarde("minute"),
    waarde("second")
  );

  const verschil = gok.getTime() - alsUtc;
  return new Date(gok.getTime() + verschil);
}

// Omgekeerde: een Date (UTC-instant) naar een "YYYY-MM-DDTHH:mm"-string in
// Brussels-tijd, voor het vooraf invullen van een <input type="datetime-local">.
export function utcNaarBrusselsInputWaarde(datum: Date): string {
  const delen = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);

  const waarde = (type: string) => delen.find((d) => d.type === type)?.value ?? "00";
  return `${waarde("year")}-${waarde("month")}-${waarde("day")}T${waarde("hour")}:${waarde("minute")}`;
}
