import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Soort } from "@/lib/soort-types";

export * from "@/lib/soort-types";

const SOORT_SELECT = {
  id: true,
  naamNl: true,
  naamTr: true,
  kleur: true,
  zichtbaarheid: true,
  kernSoort: true,
} as const;

async function fetchSoorten(metLeiding: boolean): Promise<Soort[]> {
  const rijen = await prisma.soort.findMany({
    where: metLeiding ? {} : { zichtbaarheid: "publiek" },
    orderBy: { id: "asc" },
    select: SOORT_SELECT,
  });

  return rijen as Soort[];
}

const getSoortenPubliekCached = unstable_cache(() => fetchSoorten(false), ["soorten", "publiek"], {
  revalidate: 3600,
  tags: ["soorten"],
});

const getSoortenMetLeidingCached = unstable_cache(() => fetchSoorten(true), ["soorten", "met-leiding"], {
  revalidate: 3600,
  tags: ["soorten"],
});

// Gecachet en getagd: elke schrijfactie op soorten (zie
// app/beheer/soorten/actions.ts) roept updateTag("soorten") aan.
export async function getSoorten(metLeiding: boolean): Promise<Soort[]> {
  return metLeiding ? getSoortenMetLeidingCached() : getSoortenPubliekCached();
}
