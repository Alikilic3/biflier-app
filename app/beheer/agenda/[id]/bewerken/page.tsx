import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEigenaar } from "@/lib/dal";
import { utcNaarBrusselsInputWaarde } from "@/lib/activiteiten";
import { getSoorten } from "@/lib/soorten";
import ActiviteitForm, { type ActiviteitFormWaarden } from "@/app/beheer/agenda/ActiviteitForm";
import { bewerkActiviteit } from "@/app/beheer/agenda/actions";
import VerwijderKnoppen from "./VerwijderKnoppen";

export default async function ActiviteitBewerkenPagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEigenaar();

  const { id } = await params;
  const activiteitId = Number(id);

  if (!Number.isInteger(activiteitId)) {
    notFound();
  }

  const activiteit = await prisma.activiteit.findUnique({ where: { id: activiteitId } });

  if (!activiteit) {
    notFound();
  }

  const soorten = await getSoorten(true);

  const reeksAantal = activiteit.reeksId
    ? await prisma.activiteit.count({ where: { reeksId: activiteit.reeksId } })
    : 1;

  const brusselsDatum = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });

  const initieel: ActiviteitFormWaarden = {
    titel: activiteit.titel,
    titelTr: activiteit.titelTr ?? "",
    soortId: activiteit.soortId,
    zichtbaarheid: activiteit.zichtbaarheid,
    locatie: activiteit.locatie ?? "",
    locatieTr: activiteit.locatieTr ?? "",
    beschrijving: activiteit.beschrijving ?? "",
    beschrijvingTr: activiteit.beschrijvingTr ?? "",
    heleDag: activiteit.heleDag,
    startInput: utcNaarBrusselsInputWaarde(activiteit.start),
    eindeInput: utcNaarBrusselsInputWaarde(activiteit.einde),
    startDatumInput: brusselsDatum(activiteit.start),
    eindeDatumInput: brusselsDatum(activiteit.einde),
  };

  const actie = bewerkActiviteit.bind(null, activiteitId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/beheer/agenda"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[#14231a] no-underline"
      >
        ← Terug naar agendabeheer
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[#14231a]">Activiteit bewerken</h1>
      <ActiviteitForm
        actie={actie}
        initieel={initieel}
        soorten={soorten}
        reeksKeuze={activiteit.reeksId ? { reeksAantal } : undefined}
      />

      <div className="mt-10 border-t border-[#dfe3dd] pt-6">
        <h2 className="mb-3 text-sm font-semibold text-red-700">Verwijderen</h2>
        <VerwijderKnoppen
          id={activiteit.id}
          titel={activiteit.titel}
          reeksAantal={activiteit.reeksId ? reeksAantal : null}
        />
      </div>
    </div>
  );
}
