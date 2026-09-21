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

export async function berekenWaarschuwingen(): Promise<Waarschuwing[]> {
  const lezingenAsc = await prisma.lezing.findMany({
    orderBy: { datum: "asc" },
    select: { id: true, titel: true, datum: true },
  });

  if (lezingenAsc.length < MIN_MISTE_LEZINGEN_OP_RIJ) {
    return [];
  }

  const actieveLeerlingen = await prisma.leerling.findMany({
    where: { actief: true },
    include: { aanwezigheden: true },
  });

  const waarschuwingen: Waarschuwing[] = [];

  for (const leerling of actieveLeerlingen) {
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
