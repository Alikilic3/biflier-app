"use client";

import { useState, useTransition } from "react";
import { updateLezing, deleteLezing } from "./actions";

type Lezing = {
  id: number;
  titel: string | null;
  datum: string;
  huis: string;
  hatip: string;
};

export default function LezingBeheer({ lezing }: { lezing: Lezing }) {
  const [bewerken, setBewerken] = useState(false);
  const [bezigMetVerwijderen, startVerwijderen] = useTransition();

  function handleVerwijderen() {
    const bevestigd = window.confirm(
      "Weet je zeker dat je deze lezing wil verwijderen? Dit verwijdert ook alle aanwezigheidsgegevens van deze lezing."
    );
    if (!bevestigd) return;

    startVerwijderen(async () => {
      await deleteLezing(lezing.id);
    });
  }

  if (bewerken) {
    return (
      <form
        action={async (formData) => {
          await updateLezing(lezing.id, formData);
          setBewerken(false);
        }}
        className="mt-4 space-y-4 border-t border-neutral-100 pt-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Datum
            </label>
            <input
              type="date"
              name="datum"
              defaultValue={lezing.datum}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Titel
            </label>
            <input
              name="titel"
              defaultValue={lezing.titel ?? ""}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Huis
            </label>
            <input
              name="huis"
              defaultValue={lezing.huis}
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
              defaultValue={lezing.hatip}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Opslaan
          </button>
          <button
            type="button"
            onClick={() => setBewerken(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Annuleren
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex gap-3 border-t border-neutral-100 pt-4">
      <button
        type="button"
        onClick={() => setBewerken(true)}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        Bewerken
      </button>
      <button
        type="button"
        onClick={handleVerwijderen}
        disabled={bezigMetVerwijderen}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {bezigMetVerwijderen ? "Bezig..." : "Verwijderen"}
      </button>
    </div>
  );
}
