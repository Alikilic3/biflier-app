import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBeheerder } from "@/lib/dal";
import { berekenWaarschuwingen } from "@/lib/waarschuwingen";
import AttendanceTrendChart from "./components/AttendanceTrendChart";
import LeerlingZoekbalk from "./components/LeerlingZoekbalk";

function formatDatum(datum: Date) {
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatKorteDatum(datum: Date) {
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

export default async function HomePage() {
  const beheerder = await getBeheerder();

  const lezingenAsc = await prisma.lezing.findMany({
    orderBy: { datum: "asc" },
    include: {
      _count: {
        select: { aanwezigheden: { where: { aanwezig: true } } },
      },
    },
  });

  const lezingen = [...lezingenAsc].reverse();

  const totaalLezingen = lezingen.length;
  const totaalAanwezigen = lezingen.reduce(
    (som, lezing) => som + lezing._count.aanwezigheden,
    0
  );
  // Altijd naar boven afgerond, zodat "gemiddeld aanwezig" nooit een te
  // optimistisch (naar beneden afgerond) beeld geeft.
  const gemiddeldAanwezig =
    totaalLezingen > 0 ? Math.ceil(totaalAanwezigen / totaalLezingen) : 0;
  const druksteLezing = lezingen.reduce(
    (max, lezing) => Math.max(max, lezing._count.aanwezigheden),
    0
  );

  const trendData = lezingenAsc.map((lezing) => ({
    id: lezing.id,
    label: lezing.titel ?? `Lezing #${lezing.id}`,
    datumLabel: formatKorteDatum(lezing.datum),
    aantal: lezing._count.aanwezigheden,
  }));

  // Waarschuwingssysteem: alleen relevant, en alleen berekend, voor
  // ingelogde beheerders. Zie lib/waarschuwingen.ts voor de berekening.
  const waarschuwingen = beheerder ? await berekenWaarschuwingen() : [];

  const alleLeerlingen = await prisma.leerling.findMany({
    select: { id: true, naam: true },
    orderBy: { naam: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-6 sm:py-10">
      <h1 className="text-xl font-semibold text-neutral-900">Lezingen</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Overzicht van alle lezingen en de aanwezigheid.
      </p>

      <LeerlingZoekbalk leerlingen={alleLeerlingen} />

      {beheerder && waarschuwingen.length > 0 && (
        <Link
          href="/afwezigheden"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 sm:p-5"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <span aria-hidden className="text-lg">
              ⚠️
            </span>
            {waarschuwingen.length === 1
              ? "1 leerling heeft 2 lezingen op rij gemist"
              : `${waarschuwingen.length} leerlingen hebben 2 lezingen op rij gemist`}
          </span>
          <span aria-hidden className="text-amber-700">
            →
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm text-neutral-500">Gemiddeld aanwezig</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {gemiddeldAanwezig}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm text-neutral-500">Aantal lezingen</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {totaalLezingen}
          </p>
        </div>
      </div>

      {trendData.length >= 2 && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <AttendanceTrendChart data={trendData} />
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {lezingen.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Nog geen lezingen gevonden.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {lezingen.map((lezing) => {
              const aantal = lezing._count.aanwezigheden;
              const percentage =
                druksteLezing > 0 ? (aantal / druksteLezing) * 100 : 0;

              return (
                <li key={lezing.id}>
                  <Link
                    href={`/lezingen/${lezing.id}`}
                    className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {lezing.titel ?? `Lezing #${lezing.id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDatum(lezing.datum)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm font-semibold text-neutral-900">
                      {aantal}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
