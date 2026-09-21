import Link from "next/link";
import { redirect } from "next/navigation";
import { getBeheerder } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createLeerling, updateLeerling } from "./actions";
import LeerlingZoeklijst from "./LeerlingZoeklijst";

export default async function LeerlingenPage() {
  const beheerder = await getBeheerder();

  if (beheerder?.rol !== "admin") {
    redirect("/");
  }

  const leerlingen = await prisma.leerling.findMany({
    orderBy: { naam: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← Terug naar overzicht
      </Link>

      <h1 className="text-xl font-semibold text-neutral-900">Leerlingen</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Beheer de leerlingenlijst.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-medium text-neutral-700">
          Nieuwe leerling
        </h2>
        <form
          action={createLeerling}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-neutral-500">Naam</label>
            <input
              name="naam"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base sm:w-auto"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-neutral-500">
              Telefoon ouder (optioneel)
            </label>
            <input
              name="telefoonOuder"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base sm:w-auto"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 sm:w-auto sm:py-1.5"
          >
            Toevoegen
          </button>
        </form>
      </div>

      <LeerlingZoeklijst
        leerlingen={leerlingen}
        updateLeerlingAction={updateLeerling}
      />
    </div>
  );
}
