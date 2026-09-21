"use client";

import { useState } from "react";
import Link from "next/link";

type Leerling = {
  id: number;
  naam: string;
  telefoonOuder: string | null;
  actief: boolean;
};

export default function LeerlingRow({
  leerling,
  updateLeerlingAction,
}: {
  leerling: Leerling;
  updateLeerlingAction: (formData: FormData) => Promise<void>;
}) {
  const [bewerken, setBewerken] = useState(false);

  if (bewerken) {
    return (
      <li className="px-5 py-4">
        <form
          action={async (formData) => {
            await updateLeerlingAction(formData);
            setBewerken(false);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-neutral-500">Naam</label>
            <input
              name="naam"
              defaultValue={leerling.naam}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base sm:w-auto"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-neutral-500">
              Telefoon ouder
            </label>
            <input
              name="telefoonOuder"
              defaultValue={leerling.telefoonOuder ?? ""}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base sm:w-auto"
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-neutral-600 sm:pb-1.5">
            <input
              type="checkbox"
              name="actief"
              defaultChecked={leerling.actief}
              className="rounded border-neutral-300"
            />
            Actief
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => setBewerken(false)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div className="min-w-0">
        <Link
          href={`/leerlingen/${leerling.id}`}
          className="block truncate text-sm font-medium text-neutral-900 hover:underline"
        >
          {leerling.naam}
          {!leerling.actief && (
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-500">
              inactief
            </span>
          )}
        </Link>
        <p className="mt-0.5 text-xs text-neutral-500">
          {leerling.telefoonOuder || "Geen telefoonnummer"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setBewerken(true)}
        className="shrink-0 text-sm text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
      >
        Bewerken
      </button>
    </li>
  );
}
