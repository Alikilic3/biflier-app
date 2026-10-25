import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBeheerder } from "@/lib/dal";
import { huidigeTaal } from "@/lib/taal";
import { vertaaldVeld } from "@/lib/vertaling";
import { soortNaam } from "@/lib/soort-types";
import {
  activiteitIcsUrl,
  activiteitWebcalUrl,
  agendaWebcalUrl,
  googleEventUrl,
} from "@/lib/agenda-links";
import KopieerLinkKnop from "@/app/components/KopieerLinkKnop";

function brusselsDatumLang(d: Date): string {
  const tekst = d.toLocaleDateString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

function brusselsTijd(d: Date): string {
  return d.toLocaleTimeString("nl-BE", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function ActiviteitDetailPagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activiteitId = Number(id);

  if (!Number.isInteger(activiteitId)) {
    notFound();
  }

  const beheerder = await getBeheerder();
  const leiding = beheerder != null;

  const activiteit = await prisma.activiteit.findUnique({
    where: { id: activiteitId },
    include: { soort: true },
  });

  if (
    !activiteit ||
    ((activiteit.zichtbaarheid === "leiding" || activiteit.soort.zichtbaarheid === "leiding") && !leiding)
  ) {
    notFound();
  }

  const taal = await huidigeTaal();
  const titel = vertaaldVeld(taal, activiteit.titel, activiteit.titelTr);
  const locatie = activiteit.locatie ? vertaaldVeld(taal, activiteit.locatie, activiteit.locatieTr) : null;
  const beschrijving = activiteit.beschrijving
    ? vertaaldVeld(taal, activiteit.beschrijving, activiteit.beschrijvingTr)
    : null;

  const googleUrl = googleEventUrl({
    titel,
    start: activiteit.start,
    einde: activiteit.einde,
    locatie,
    beschrijving,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[#14231a] no-underline"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Agenda
      </Link>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4f5b53]">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: activiteit.soort.kleur }} />
          {soortNaam(activiteit.soort, taal)}
        </div>
        <h1 className="m-0 text-[32px] leading-[1.1] font-bold tracking-tight">{titel}</h1>
        <div className="flex flex-col gap-3 text-base">
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <span>{brusselsDatumLang(activiteit.start)}</span>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon />
            <span>{activiteit.heleDag ? "Hele dag" : `${brusselsTijd(activiteit.start)} uur`}</span>
          </div>
          {locatie && (
            <div className="flex items-center gap-3">
              <PinIcon />
              <span>{locatie}</span>
            </div>
          )}
        </div>
        {beschrijving && (
          <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-[#14231a]">
            {beschrijving}
          </p>
        )}
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dfe3dd] bg-white p-5">
        <h2 className="m-0 text-lg font-bold">Toevoegen aan mijn agenda</h2>
        <div className="flex flex-col gap-2">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-13 items-center justify-between rounded-full px-[18px] text-[15px] font-semibold text-white no-underline"
            style={{ height: "52px", background: "#0b853f" }}
          >
            Google Agenda
            <PlusIcon />
          </a>
          <a
            href={activiteitWebcalUrl(activiteit.id)}
            className="flex h-13 items-center justify-between rounded-full px-[18px] text-[15px] font-semibold text-white no-underline"
            style={{ height: "52px", background: "#0b853f" }}
          >
            Apple Agenda
            <PlusIcon />
          </a>
          <a
            href={activiteitIcsUrl(activiteit.id)}
            className="flex h-13 items-center justify-between rounded-full border-[1.5px] border-[#14231a] px-[18px] text-[15px] font-semibold text-[#14231a] no-underline"
            style={{ height: "52px" }}
          >
            Downloaden (.ics)
            <DownloadIcon />
          </a>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl bg-[#14231a] p-5 text-white">
        <h2 className="m-0 text-lg font-bold">Altijd up-to-date blijven</h2>
        <p className="m-0 text-sm leading-relaxed text-[#d5ddd7]">
          Abonneer op de hele agenda: nieuwe en gewijzigde activiteiten komen vanzelf in je eigen
          agenda-app terecht.
        </p>
        <a
          href={agendaWebcalUrl()}
          className="flex h-13 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-[#14231a] no-underline"
          style={{ height: "52px" }}
        >
          Abonneer op de agenda
        </a>
        <KopieerLinkKnop url="https://biflier.com/agenda.ics" />
        <p className="m-0 text-xs leading-relaxed text-[#d5ddd7]">
          Let op: Google Agenda ververst abonnementen zelf en kan er enkele uren over doen.
        </p>
      </section>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f5b53" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f5b53" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f5b53" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  );
}
