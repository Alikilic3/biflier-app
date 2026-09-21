import Link from "next/link";
import { redirect } from "next/navigation";
import { getBeheerder } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function AfwezighedenPage() {
  const beheerder = await getBeheerder();

  if (!beheerder) {
    redirect("/login");
  }

  const totaalLezingen = await prisma.lezing.count();

  const actieveLeerlingen = await prisma.leerling.findMany({
    where: { actief: true },
    include: { aanwezigheden: true },
  });

  const rijen = actieveLeerlingen
    .map((leerling) => {
      const aantalAanwezig = leerling.aanwezigheden.filter(
        (a) => a.aanwezig
      ).length;
      // Ontbrekende records tellen als afwezig, consistent met de rest van
      // de app (zie bv. de aanwezigheidslijst op de lezing-detailpagina).
      const aantalAfwezig = totaalLezingen - aantalAanwezig;
      return { id: leerling.id, naam: leerling.naam, aantalAfwezig };
    })
    .filter((r) => r.aantalAfwezig >= 2)
    .sort((a, b) => b.aantalAfwezig - a.aantalAfwezig);

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← Terug naar overzicht
      </Link>

      <h1 className="text-xl font-semibold text-neutral-900">Afwezigheden</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Actieve leerlingen die in totaal minstens 2 keer afwezig waren, van de{" "}
        {totaalLezingen} lezingen tot nu toe.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {rijen.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Geen leerlingen met 2 of meer keer afwezig.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rijen.map((rij) => (
              <li key={rij.id}>
                <Link
                  href={`/leerlingen/${rij.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5"
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {rij.naam}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {rij.aantalAfwezig}x afwezig
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
