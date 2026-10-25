import Link from "next/link";
import { requireEigenaar } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

function formatDatumTijd(start: Date, einde: Date, heleDag: boolean): string {
  const datumOpties: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Brussels",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const tijdOpties: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  if (heleDag) {
    return start.toLocaleDateString("nl-BE", datumOpties);
  }

  return `${start.toLocaleDateString("nl-BE", datumOpties)} · ${start.toLocaleTimeString("nl-BE", tijdOpties)}–${einde.toLocaleTimeString("nl-BE", tijdOpties)}`;
}

export default async function BeheerAgendaPagina() {
  await requireEigenaar();

  const activiteiten = await prisma.activiteit.findMany({
    orderBy: { start: "asc" },
    include: { soort: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#14231a]">Agendabeheer</h1>
        <Link
          href="/beheer/agenda/nieuw"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0b853f] px-5 text-sm font-semibold text-white no-underline"
        >
          + Nieuwe activiteit
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white">
        {activiteiten.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#4f5b53]">Nog geen activiteiten.</p>
        ) : (
          <ul className="divide-y divide-[#f0efe9]">
            {activiteiten.map((a) => {
              return (
                <li key={a.id}>
                  <Link
                    href={`/beheer/agenda/${a.id}/bewerken`}
                    className="flex items-center gap-4 px-4 py-4 no-underline transition-colors hover:bg-[#f6f5f1] sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: a.soort.kleur }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#14231a]">
                        {a.titel}
                        {a.zichtbaarheid === "leiding" && (
                          <span className="ml-2 rounded-full bg-[#f0efe9] px-2 py-0.5 text-[11px] font-medium text-[#4f5b53]">
                            leiding
                          </span>
                        )}
                        {a.reeksId && (
                          <span className="ml-2 rounded-full bg-[#f0efe9] px-2 py-0.5 text-[11px] font-medium text-[#4f5b53]">
                            reeks
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#4f5b53]">
                        {a.soort.naamNl} · {formatDatumTijd(a.start, a.einde, a.heleDag)}
                      </span>
                    </span>
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
