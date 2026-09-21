import Link from "next/link";
import { redirect } from "next/navigation";
import { getBeheerder } from "@/lib/dal";
import { createLezing } from "./actions";

export default async function NieuweLezingPage() {
  const beheerder = await getBeheerder();

  if (beheerder?.rol !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-md px-2 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← Terug naar overzicht
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          Nieuwe lezing
        </h1>

        <form action={createLezing} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Datum
            </label>
            <input
              type="date"
              name="datum"
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Titel (optioneel)
            </label>
            <input
              name="titel"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Huis
            </label>
            <input
              name="huis"
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Hatip
            </label>
            <input
              name="hatip"
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Lezing aanmaken
          </button>
        </form>
      </div>
    </div>
  );
}
