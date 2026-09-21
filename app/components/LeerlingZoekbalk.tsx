"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Leerling = {
  id: number;
  naam: string;
};

const MAX_RESULTATEN = 8;

export default function LeerlingZoekbalk({
  leerlingen,
}: {
  leerlingen: Leerling[];
}) {
  const [zoekterm, setZoekterm] = useState("");

  const resultaten = useMemo(() => {
    const q = zoekterm.trim().toLowerCase();
    if (!q) return [];
    return leerlingen
      .filter((l) => l.naam.toLowerCase().includes(q))
      .slice(0, MAX_RESULTATEN);
  }, [leerlingen, zoekterm]);

  const toontResultaten = zoekterm.trim() !== "";

  return (
    <div className="mt-6">
      <input
        type="search"
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        placeholder="Zoek een leerling op naam..."
        aria-label="Zoek leerling op naam"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />

      {toontResultaten && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {resultaten.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              Geen leerlingen gevonden.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {resultaten.map((leerling) => (
                <li key={leerling.id}>
                  <Link
                    href={`/leerlingen/${leerling.id}`}
                    className="block px-4 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
                  >
                    {leerling.naam}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
