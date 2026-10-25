"use server";

import { randomUUID } from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEigenaar } from "@/lib/dal";
import { brusselsNaarUtc } from "@/lib/activiteiten";
import { ZICHTBAARHEDEN, type Zichtbaarheid } from "@/lib/activiteit-types";

// updateTag (i.p.v. revalidateTag) omdat dit altijd binnen een Server Action
// gebeurt: de admin moet de wijziging onmiddellijk terugzien ("read-your-own
// -writes"), niet nog even de oude (stale) agenda tot de achtergrond-
// revalidatie klaar is.
function herAgenda() {
  updateTag("activiteiten");
  revalidatePath("/");
  revalidatePath("/agenda.ics");
}

async function parseSoortId(waarde: FormDataEntryValue | null): Promise<number> {
  const id = typeof waarde === "string" ? Number(waarde) : NaN;
  if (!Number.isInteger(id)) {
    throw new Error("Ongeldige soort.");
  }

  const bestaat = await prisma.soort.findUnique({ where: { id }, select: { id: true } });
  if (!bestaat) {
    throw new Error("Ongeldige soort.");
  }

  return id;
}

function parseZichtbaarheid(waarde: FormDataEntryValue | null): Zichtbaarheid {
  if (typeof waarde === "string" && (ZICHTBAARHEDEN as readonly string[]).includes(waarde)) {
    return waarde as Zichtbaarheid;
  }
  throw new Error("Ongeldige zichtbaarheid.");
}

function verplicht(waarde: FormDataEntryValue | null, veld: string): string {
  if (typeof waarde !== "string" || waarde.trim() === "") {
    throw new Error(`${veld} is verplicht.`);
  }
  return waarde.trim();
}

function optioneel(waarde: FormDataEntryValue | null): string | null {
  return typeof waarde === "string" && waarde.trim() !== "" ? waarde.trim() : null;
}

// Telt dagen bij een "YYYY-MM-DDTHH:mm"-string op als kalenderdagen (puur
// datum-rekenen, geen tijdzone-conversie), met behoud van het tijdsgedeelte.
// Nodig omdat een vaste UTC-millisecondenverschuiving per week het
// lokale (Brussels) tijdstip laat opschuiven zodra de reeks een
// zomer-/wintertijdovergang kruist — zie _tmp-test-reeks.ts.
function lokaleDatumPlusDagen(dateTimeLocal: string, dagen: number): string {
  const [datumDeel, tijdDeel] = dateTimeLocal.split("T");
  const [jaar, maand, dag] = datumDeel.split("-").map(Number);
  const basis = new Date(Date.UTC(jaar, maand - 1, dag));
  basis.setUTCDate(basis.getUTCDate() + dagen);
  const yyyy = basis.getUTCFullYear();
  const mm = String(basis.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(basis.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${tijdDeel}`;
}

function brusselsDagSleutel(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });
}

async function veldUitFormulier(formData: FormData) {
  const heleDag = formData.get("heleDag") === "on";
  const titel = verplicht(formData.get("titel"), "Titel");
  const titelTr = optioneel(formData.get("titelTr"));
  const soortId = await parseSoortId(formData.get("soortId"));
  const zichtbaarheid = parseZichtbaarheid(formData.get("zichtbaarheid"));
  const locatie = optioneel(formData.get("locatie"));
  const locatieTr = optioneel(formData.get("locatieTr"));
  const beschrijving = optioneel(formData.get("beschrijving"));
  const beschrijvingTr = optioneel(formData.get("beschrijvingTr"));

  let start: Date;
  let einde: Date;

  if (heleDag) {
    const startDatum = verplicht(formData.get("startDatum"), "Startdatum");
    const eindeDatum = verplicht(formData.get("eindeDatum"), "Einddatum");
    start = brusselsNaarUtc(`${startDatum}T00:00`);
    einde = brusselsNaarUtc(`${eindeDatum}T00:00`);
  } else {
    const startLocal = verplicht(formData.get("start"), "Startmoment");
    const eindeLocal = verplicht(formData.get("einde"), "Eindmoment");
    start = brusselsNaarUtc(startLocal);
    einde = brusselsNaarUtc(eindeLocal);
  }

  if (einde < start) {
    throw new Error("Einde kan niet vóór de start liggen.");
  }

  return {
    titel,
    titelTr,
    soortId,
    zichtbaarheid,
    locatie,
    locatieTr,
    beschrijving,
    beschrijvingTr,
    heleDag,
    start,
    einde,
  };
}

export async function maakActiviteit(_prevState: string | undefined, formData: FormData) {
  await requireEigenaar();

  let veld: Awaited<ReturnType<typeof veldUitFormulier>>;
  try {
    veld = await veldUitFormulier(formData);
  } catch (error) {
    return error instanceof Error ? error.message : "Ongeldige invoer.";
  }

  const herhaalTot = formData.get("herhaalTot");
  const magHerhalen = !veld.heleDag && typeof herhaalTot === "string" && herhaalTot.trim() !== "";

  if (!magHerhalen) {
    await prisma.activiteit.create({ data: veld });
  } else {
    const startLocalRaw = verplicht(formData.get("start"), "Startmoment");
    const eindeLocalRaw = verplicht(formData.get("einde"), "Eindmoment");
    const eindDatum = brusselsNaarUtc(`${herhaalTot}T00:00`);
    const reeksId = randomUUID();
    const rijen: (typeof veld & { reeksId: string })[] = [];

    // Veiligheidsgrens: nooit meer dan 2 jaar aan wekelijkse herhalingen in
    // één keer aanmaken, mocht er per ongeluk een verre datum ingevuld worden.
    const MAX_HERHALINGEN = 104;

    for (let week = 0; week < MAX_HERHALINGEN; week++) {
      // Elke occurrence apart via brusselsNaarUtc herberekenen (i.p.v. een
      // vaste 7-dagen-in-milliseconden-sprong), zodat het lokale tijdstip
      // (bv. 19:30) behouden blijft ook als de reeks een zomer-/
      // wintertijdovergang kruist.
      const start = brusselsNaarUtc(lokaleDatumPlusDagen(startLocalRaw, week * 7));
      if (start.getTime() > eindDatum.getTime() + 23 * 60 * 60 * 1000) break;
      const einde = brusselsNaarUtc(lokaleDatumPlusDagen(eindeLocalRaw, week * 7));
      rijen.push({ ...veld, start, einde, reeksId });
    }

    await prisma.activiteit.createMany({ data: rijen });
  }

  herAgenda();
  redirect("/beheer/agenda");
}

export async function bewerkActiviteit(
  id: number,
  _prevState: string | undefined,
  formData: FormData
) {
  await requireEigenaar();

  const scope = formData.get("scope") === "reeks" ? "reeks" : "deze";

  let veld: Awaited<ReturnType<typeof veldUitFormulier>>;
  try {
    veld = await veldUitFormulier(formData);
  } catch (error) {
    return error instanceof Error ? error.message : "Ongeldige invoer.";
  }

  const bestaand = await prisma.activiteit.findUnique({ where: { id } });
  if (!bestaand) {
    return "Activiteit niet gevonden.";
  }

  if (scope === "deze" || !bestaand.reeksId) {
    await prisma.activiteit.update({ where: { id }, data: veld });
  } else {
    const reeks = await prisma.activiteit.findMany({ where: { reeksId: bestaand.reeksId } });

    if (veld.heleDag) {
      // Hele-dag-reeksen: enkel de niet-datumvelden toepassen op de hele
      // reeks, elke activiteit behoudt haar eigen datum.
      await prisma.activiteit.updateMany({
        where: { reeksId: bestaand.reeksId },
        data: {
          titel: veld.titel,
          titelTr: veld.titelTr,
          soortId: veld.soortId,
          zichtbaarheid: veld.zichtbaarheid,
          locatie: veld.locatie,
          locatieTr: veld.locatieTr,
          beschrijving: veld.beschrijving,
          beschrijvingTr: veld.beschrijvingTr,
          heleDag: veld.heleDag,
        },
      });
    } else {
      const duur = veld.einde.getTime() - veld.start.getTime();
      const nieuweTijdDeel = verplicht(formData.get("start"), "Startmoment").split("T")[1];

      await prisma.$transaction(
        reeks.map((rij) => {
          // Elke rij apart herberekenen via haar EIGEN Brussels-kalenderdatum
          // (i.p.v. een vaste UTC-uuroffset kopiëren), zodat het lokale
          // tijdstip klopt ook als de reeks een DST-overgang kruist.
          const eigenDatum = brusselsDagSleutel(rij.start);
          const nieuweStart = brusselsNaarUtc(`${eigenDatum}T${nieuweTijdDeel}`);
          const nieuweEinde = new Date(nieuweStart.getTime() + duur);

          return prisma.activiteit.update({
            where: { id: rij.id },
            data: {
              titel: veld.titel,
              titelTr: veld.titelTr,
              soortId: veld.soortId,
              zichtbaarheid: veld.zichtbaarheid,
              locatie: veld.locatie,
              locatieTr: veld.locatieTr,
              beschrijving: veld.beschrijving,
              beschrijvingTr: veld.beschrijvingTr,
              heleDag: veld.heleDag,
              start: nieuweStart,
              einde: nieuweEinde,
            },
          });
        })
      );
    }
  }

  herAgenda();
  revalidatePath(`/activiteit/${id}`);
  redirect("/beheer/agenda");
}

export async function verwijderActiviteit(id: number, scope: "deze" | "reeks") {
  await requireEigenaar();

  const bestaand = await prisma.activiteit.findUnique({ where: { id } });
  if (!bestaand) {
    redirect("/beheer/agenda");
  }

  if (scope === "reeks" && bestaand.reeksId) {
    await prisma.activiteit.deleteMany({ where: { reeksId: bestaand.reeksId } });
  } else {
    await prisma.activiteit.delete({ where: { id } });
  }

  herAgenda();
  redirect("/beheer/agenda");
}
