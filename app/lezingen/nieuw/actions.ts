"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

export async function createLezing(formData: FormData) {
  await requireAdmin();

  const datum = String(formData.get("datum") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const huis = String(formData.get("huis") ?? "").trim();
  const hatip = String(formData.get("hatip") ?? "").trim();

  if (!datum || !huis || !hatip) {
    return;
  }

  const lezing = await prisma.lezing.create({
    data: {
      datum: new Date(datum),
      titel: titel || null,
      huis,
      hatip,
    },
  });

  revalidatePath("/");
  redirect(`/lezingen/${lezing.id}`);
}
