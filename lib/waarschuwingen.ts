import "server-only";
import { prisma } from "@/lib/prisma";

export const MIN_MISTE_LEZINGEN_OP_RIJ = 2;

export type LezingKort = { id: number; titel: string | null; datum: Date };

export function berekenStreak(
  lezingenAsc: LezingKort[],
  statusPerLezing: Map<number, boolean>
): { aantalOpEenRij: number; sindsLezing: LezingKort | null } {
  let aantalOpEenRij = 0;
  let sindsLezing: LezingKort | null = null;

  for (let i = lezingenAsc.length - 1; i >= 0; i--) {
    const lezing = lezingenAsc[i];
    const wasAanwezig = statusPerLezing.get(lezing.id) ?? false;
    if (wasAanwezig) break;
    aantalOpEenRij++;
    sindsLezing = lezing;
  }

  return { aantalOpEenRij, sindsLezing };
}

export type Waarschuwing = {
  leerlingId: number;
  naam: string;
  aantalOpEenRij: number;
  sindsLezing: LezingKort;
};

type LeerlingMetAanwezigheden = {
  id: number;
  naam: string;
  actief: boolean;
  aanwezigheden: { lezingId: number; aanwezig: boolean }[];
};

/**
 * Zuivere (DB-vrije) berekening — herbruikbaar wanneer de aanroeper de
 * lezingen en leerlingen al heeft opgehaald (bv. parallel met andere
 * queries), om een dubbele round-trip naar de database te vermijden.
 */
export function berekenWaarschuwingenVanData(
  lezingenAsc: LezingKort[],
  leerlingen: LeerlingMetAanwezigheden[]
): Waarschuwing[] {
  if (lezingenAsc.length < MIN_MISTE_LEZINGEN_OP_RIJ) {
    return [];
  }

  const waarschuwingen: Waarschuwing[] = [];

  for (const leerling of leerlingen) {
    if (!leerling.actief) continue;

    const statusPerLezing = new Map(
      leerling.aanwezigheden.map((a) => [a.lezingId, a.aanwezig])
    );

    const { aantalOpEenRij, sindsLezing } = berekenStreak(
      lezingenAsc,
      statusPerLezing
    );

    if (aantalOpEenRij >= MIN_MISTE_LEZINGEN_OP_RIJ && sindsLezing) {
      waarschuwingen.push({
        leerlingId: leerling.id,
        naam: leerling.naam,
        aantalOpEenRij,
        sindsLezing,
      });
    }
  }

  waarschuwingen.sort((a, b) => b.aantalOpEenRij - a.aantalOpEenRij);

  return waarschuwingen;
}

/**
 * Gemakscalls voor plekken die de data nog niet hebben opgehaald.
 * Gebruik `berekenWaarschuwingenVanData` in plaats hiervan waar de
 * lezingen/leerlingen toch al parallel worden opgehaald.
 */
export async function berekenWaarschuwingen(): Promise<Waarschuwing[]> {
  const [lezingenAsc, leerlingen] = await Promise.all([
    prisma.lezing.findMany({
      orderBy: { datum: "asc" },
      select: { id: true, titel: true, datum: true },
    }),
    prisma.leerling.findMany({
      where: { actief: true },
      select: {
        id: true,
        naam: true,
        actief: true,
        aanwezigheden: { select: { lezingId: true, aanwezig: true } },
      },
    }),
  ]);

  return berekenWaarschuwingenVanData(lezingenAsc, leerlingen);
}
