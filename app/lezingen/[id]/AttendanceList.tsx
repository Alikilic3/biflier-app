"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { toggleAanwezigheid } from "@/app/actions";

type Leerling = {
  id: number;
  naam: string;
  aanwezig: boolean;
};

function initialen(naam: string) {
  const delen = naam.trim().split(/\s+/);
  const eerste = delen[0]?.[0] ?? "";
  const laatste = delen.length > 1 ? delen[delen.length - 1][0] : "";
  return (eerste + laatste).toUpperCase();
}

export default function AttendanceList({
  lezingId,
  leerlingen,
  isAdmin,
}: {
  lezingId: number;
  leerlingen: Leerling[];
  isAdmin: boolean;
}) {
  const [status, setStatus] = useState(
    new Map(leerlingen.map((l) => [l.id, l.aanwezig]))
  );
  const [, startTransition] = useTransition();

  function handleToggle(leerlingId: number) {
    const huidig = status.get(leerlingId) ?? false;

    setStatus((prev) => new Map(prev).set(leerlingId, !huidig));

    startTransition(async () => {
      try {
        await toggleAanwezigheid(leerlingId, lezingId);
      } catch {
        setStatus((prev) => new Map(prev).set(leerlingId, huidig));
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, id: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle(id);
    }
  }

  return (
    <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {leerlingen.map((leerling) => {
        const aanwezig = status.get(leerling.id) ?? false;

        const avatar = (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              aanwezig
                ? "bg-emerald-500 text-white"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {initialen(leerling.naam)}
          </span>
        );

        const vinkje = (
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
              aanwezig
                ? "bg-emerald-500 text-white"
                : "bg-neutral-200 text-neutral-500"
            }`}
            aria-hidden
          >
            {aanwezig ? "✓" : "✕"}
          </span>
        );

        // Elke ingelogde gebruiker (admin of lid) mag het leerlingprofiel
        // bekijken, dus de naam is altijd een link.
        const naam = (
          <Link
            href={`/leerlingen/${leerling.id}`}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 hover:underline"
          >
            {leerling.naam}
          </Link>
        );

        if (!isAdmin) {
          return (
            <li key={leerling.id}>
              <div
                className={`flex items-center gap-3 px-5 py-3 ${
                  aanwezig ? "bg-emerald-50" : ""
                }`}
              >
                {avatar}
                {naam}
                {vinkje}
              </div>
            </li>
          );
        }

        return (
          <li key={leerling.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleToggle(leerling.id)}
              onKeyDown={(e) => handleKeyDown(e, leerling.id)}
              className={`flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors ${
                aanwezig
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : "hover:bg-neutral-50"
              }`}
            >
              {avatar}
              {naam}
              {vinkje}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
