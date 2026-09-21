"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

export async function createLeerling(formData: FormData) {
  await requireAdmin();

  const naam = String(formData.get("naam") ?? "").trim();
  const telefoonOuder = String(formData.get("telefoonOuder") ?? "").trim();

  if (!naam) {
    return;
  }

  await prisma.leerling.create({
    data: {
      naam,
      telefoonOuder: telefoonOuder || null,
    },
  });

  revalidatePath("/leerlingen");
}

export async function updateLeerling(id: number, formData: FormData) {
  await requireAdmin();

  const naam = String(formData.get("naam") ?? "").trim();
  const telefoonOuder = String(formData.get("telefoonOuder") ?? "").trim();
  const actief = formData.get("actief") === "on";

  if (!naam) {
    return;
  }

  await prisma.leerling.update({
    where: { id },
    data: {
      naam,
      telefoonOuder: telefoonOuder || null,
      actief,
    },
  });

  revalidatePath("/leerlingen");
  revalidatePath("/");
}
