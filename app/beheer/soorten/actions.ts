"use server";

import { updateTag, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEigenaar } from "@/lib/dal";
import { ZICHTBAARHEDEN, type Zichtbaarheid } from "@/lib/activiteit-types";
import { SOORT_KLEUREN } from "@/lib/soort-types";

// Net als herAgenda() in app/beheer/agenda/actions.ts: updateTag (i.p.v.
// revalidateTag) zodat de eigenaar de wijziging onmiddellijk terugziet.
// Soorten bepalen mee de kleur/naam/zichtbaarheid van activiteiten, dus ook
// de "activiteiten"-cache moet mee vernieuwen.
function herAgenda() {
  updateTag("soorten");
  updateTag("activiteiten");
  revalidatePath("/");
  revalidatePath("/agenda.ics");
  revalidatePath("/beheer/agenda");
}

function verplicht(waarde: FormDataEntryValue | null, veld: string): string {
  if (typeof waarde !== "string" || waarde.trim() === "") {
    throw new Error(`${veld} is verplicht.`);
  }
  return waarde.trim();
}

function parseKleur(waarde: FormDataEntryValue | null): string {
  if (typeof waarde === "string" && (SOORT_KLEUREN as readonly string[]).includes(waarde)) {
    return waarde;
  }
  throw new Error("Ongeldige kleur.");
}

function parseZichtbaarheid(waarde: FormDataEntryValue | null): Zichtbaarheid {
  if (typeof waarde === "string" && (ZICHTBAARHEDEN as readonly string[]).includes(waarde)) {
    return waarde as Zichtbaarheid;
  }
  throw new Error("Ongeldige zichtbaarheid.");
}

function veldUitFormulier(formData: FormData) {
  return {
    naamNl: verplicht(formData.get("naamNl"), "Naam (Nederlands)"),
    naamTr: verplicht(formData.get("naamTr"), "Naam (Turks)"),
    kleur: parseKleur(formData.get("kleur")),
    zichtbaarheid: parseZichtbaarheid(formData.get("zichtbaarheid")),
  };
}

export async function maakSoort(_prevState: string | undefined, formData: FormData) {
  await requireEigenaar();

  let veld: ReturnType<typeof veldUitFormulier>;
  try {
    veld = veldUitFormulier(formData);
  } catch (error) {
    return error instanceof Error ? error.message : "Ongeldige invoer.";
  }

  await prisma.soort.create({ data: veld });
  herAgenda();
  return undefined;
}

export async function bewerkSoort(id: number, _prevState: string | undefined, formData: FormData) {
  await requireEigenaar();

  let veld: ReturnType<typeof veldUitFormulier>;
  try {
    veld = veldUitFormulier(formData);
  } catch (error) {
    return error instanceof Error ? error.message : "Ongeldige invoer.";
  }

  await prisma.soort.update({ where: { id }, data: veld });
  herAgenda();
  return undefined;
}

export async function verwijderSoort(id: number) {
  await requireEigenaar();

  const soort = await prisma.soort.findUnique({ where: { id } });
  if (!soort) {
    return "Soort niet gevonden.";
  }
  if (soort.kernSoort) {
    return "Deze soort kan niet verwijderd worden.";
  }

  const overig = await prisma.soort.findFirst({ where: { kernSoort: true } });
  if (!overig) {
    return "De standaardsoort 'Overig' ontbreekt; verwijderen is niet mogelijk.";
  }

  await prisma.$transaction([
    prisma.activiteit.updateMany({ where: { soortId: id }, data: { soortId: overig.id } }),
    prisma.soort.delete({ where: { id } }),
  ]);

  herAgenda();
  return undefined;
}
