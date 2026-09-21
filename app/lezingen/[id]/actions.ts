"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

export async function updateLezing(lezingId: number, formData: FormData) {
  await requireAdmin();

  const datum = String(formData.get("datum") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const huis = String(formData.get("huis") ?? "").trim();
  const hatip = String(formData.get("hatip") ?? "").trim();

  if (!datum || !huis || !hatip) {
    return;
  }

  await prisma.lezing.update({
    where: { id: lezingId },
    data: {
      datum: new Date(datum),
      titel: titel || null,
      huis,
      hatip,
    },
  });

  revalidatePath("/");
  revalidatePath(`/lezingen/${lezingId}`);
}

export async function deleteLezing(lezingId: number) {
  await requireAdmin();

  // De Aanwezigheid-records worden automatisch mee verwijderd door de
  // `onDelete: Cascade` op de relatie in prisma/schema.prisma.
  await prisma.lezing.delete({
    where: { id: lezingId },
  });

  revalidatePath("/");
  redirect("/");
}
