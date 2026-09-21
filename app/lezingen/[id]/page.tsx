import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBeheerder } from "@/lib/dal";
import AttendanceList from "./AttendanceList";
import LezingBeheer from "./LezingBeheer";

function formatDatum(datum: Date) {
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function LezingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lezingId = Number(id);

  if (!Number.isInteger(lezingId)) {
    notFound();
  }

  const lezing = await prisma.lezing.findUnique({
    where: { id: lezingId },
  });

  if (!lezing) {
    notFound();
  }

  const beheerder = await getBeheerder();
  const isAdmin = beheerder?.rol === "admin";

  const leerlingen = await prisma.leerling.findMany({
    where: { actief: true },
    orderBy: { naam: "asc" },
    include: {
      aanwezigheden: { where: { lezingId } },
    },
  });

  const leerlingenMetStatus = leerlingen.map((leerling) => ({
    id: leerling.id,
    naam: leerling.naam,
    aanwezig: leerling.aanwezigheden[0]?.aanwezig ?? false,
  }));

  const aantalAanwezig = leerlingenMetStatus.filter((l) => l.aanwezig).length;
  const aantalAfwezig = leerlingenMetStatus.length - aantalAanwezig;

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← Terug naar overzicht
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          {lezing.titel ?? `Lezing #${lezing.id}`}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {formatDatum(lezing.datum)}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Huis</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">
              {lezing.huis}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Hatip</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">
              {lezing.hatip}
            </dd>
          </div>
        </dl>

        {isAdmin && (
          <LezingBeheer
            lezing={{
              id: lezing.id,
              titel: lezing.titel,
              datum: lezing.datum.toISOString().slice(0, 10),
              huis: lezing.huis,
              hatip: lezing.hatip,
            }}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm text-neutral-500">Aanwezig</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {aantalAanwezig}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm text-neutral-500">Afwezig</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {aantalAfwezig}
          </p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-neutral-500">
        Leerlingen
      </h2>

      {leerlingenMetStatus.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white shadow-sm px-5 py-8 text-center text-sm text-neutral-500">
          Nog geen leerlingen gevonden.
        </p>
      ) : (
        <AttendanceList
          lezingId={lezingId}
          leerlingen={leerlingenMetStatus}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
