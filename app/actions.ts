"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

export async function toggleAanwezigheid(leerlingId: number, lezingId: number) {
  await requireAdmin();

  const bestaand = await prisma.aanwezigheid.findUnique({
    where: { leerlingId_lezingId: { leerlingId, lezingId } },
  });

  await prisma.aanwezigheid.upsert({
    where: { leerlingId_lezingId: { leerlingId, lezingId } },
    create: { leerlingId, lezingId, aanwezig: true },
    update: { aanwezig: !bestaand?.aanwezig },
  });

  revalidatePath("/");
  revalidatePath(`/lezingen/${lezingId}`);
}
