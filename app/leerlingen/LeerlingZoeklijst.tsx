"use client";

import { useMemo, useState } from "react";
import LeerlingRow from "./LeerlingRow";

type Leerling = {
  id: number;
  naam: string;
  telefoonOuder: string | null;
  actief: boolean;
};

export default function LeerlingZoeklijst({
  leerlingen,
  updateLeerlingAction,
}: {
  leerlingen: Leerling[];
  updateLeerlingAction: (id: number, formData: FormData) => Promise<void>;
}) {
  const [zoekterm, setZoekterm] = useState("");

  const gefilterd = useMemo(() => {
    const q = zoekterm.trim().toLowerCase();
    if (!q) return leerlingen;
    return leerlingen.filter((l) => l.naam.toLowerCase().includes(q));
  }, [leerlingen, zoekterm]);

  return (
    <div className="mt-6">
      <input
        type="search"
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        placeholder="Zoek op naam..."
        aria-label="Zoek leerling op naam"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />

      <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {gefilterd.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            {leerlingen.length === 0
              ? "Nog geen leerlingen."
              : "Geen leerlingen gevonden."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {gefilterd.map((leerling) => (
              <LeerlingRow
                key={leerling.id}
                leerling={leerling}
                updateLeerlingAction={updateLeerlingAction.bind(
                  null,
                  leerling.id
                )}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
