import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBeheerder } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { berekenStreak, MIN_MISTE_LEZINGEN_OP_RIJ } from "@/lib/waarschuwingen";
import AttendanceTrendChart from "@/app/components/AttendanceTrendChart";

function formatDatum(datum: Date) {
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatKorteDatum(datum: Date) {
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

function initialen(naam: string) {
  const delen = naam.trim().split(/\s+/);
  const eerste = delen[0]?.[0] ?? "";
  const laatste = delen.length > 1 ? delen[delen.length - 1][0] : "";
  return (eerste + laatste).toUpperCase();
}

export default async function LeerlingProfielPagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const beheerder = await getBeheerder();

  if (!beheerder) {
    redirect("/login");
  }

  const { id } = await params;
  const leerlingId = Number(id);

  if (!Number.isInteger(leerlingId)) {
    notFound();
  }

  const leerling = await prisma.leerling.findUnique({
    where: { id: leerlingId },
    include: { aanwezigheden: true },
  });

  if (!leerling) {
    notFound();
  }

  const lezingenAsc = await prisma.lezing.findMany({
    orderBy: { datum: "asc" },
    select: { id: true, titel: true, datum: true },
  });

  const statusPerLezing = new Map(
    leerling.aanwezigheden.map((a) => [a.lezingId, a.aanwezig])
  );

  const totaalLezingen = lezingenAsc.length;
  const totaalBijgewoond = lezingenAsc.filter(
    (l) => statusPerLezing.get(l.id) === true
  ).length;

  const chartData = lezingenAsc.map((l) => ({
    id: l.id,
    label: l.titel ?? `Lezing #${l.id}`,
    datumLabel: formatKorteDatum(l.datum),
    aantal: statusPerLezing.get(l.id) ? 1 : 0,
  }));

  const { aantalOpEenRij, sindsLezing } = berekenStreak(
    lezingenAsc,
    statusPerLezing
  );
  const heeftWaarschuwing = aantalOpEenRij >= MIN_MISTE_LEZINGEN_OP_RIJ;

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-6 sm:py-10">
      <Link
        href="/leerlingen"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← Terug naar leerlingen
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
            {initialen(leerling.naam)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-neutral-900">
              {leerling.naam}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {leerling.telefoonOuder || "Geen telefoonnummer"}
              {!leerling.actief && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-500">
                  inactief
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm text-neutral-500">Bijgewoond</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">
          {totaalBijgewoond}{" "}
          <span className="text-base font-normal text-neutral-500">
            van de {totaalLezingen} lezingen
          </span>
        </p>
      </div>

      {chartData.length >= 2 && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <AttendanceTrendChart
            data={chartData}
            titel="Aanwezigheid per lezing"
            subtitel="1 = aanwezig, 0 = afwezig, chronologisch."
            waardeLabel="(1 = aanwezig)"
          />
        </div>
      )}

      {heeftWaarschuwing && sindsLezing && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <span aria-hidden className="text-lg">
              ⚠️
            </span>
            {leerling.naam} heeft de laatste {aantalOpEenRij} lezingen op rij
            gemist
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Sinds {sindsLezing.titel ?? `Lezing #${sindsLezing.id}`} (
            {formatDatum(sindsLezing.datum)})
          </p>
        </div>
      )}
    </div>
  );
}
