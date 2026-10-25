import { formatUtc, formatUtcDatumEnkel } from "@/lib/agenda-links";

export type IcsActiviteit = {
  id: number;
  titel: string;
  soort: { naamNl: string };
  start: Date;
  einde: Date;
  heleDag: boolean;
  locatie: string | null;
  beschrijving?: string | null;
};

// RFC 5545 §3.3.11: backslash, komma en puntkomma moeten geëscaped worden,
// newlines worden \n.
function icsEscape(tekst: string): string {
  return tekst
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// RFC 5545 §3.1: regels mogen max. 75 octets zijn, langere regels worden
// gevouwen met een CRLF gevolgd door een spatie.
function foldLine(regel: string): string {
  const MAX = 75;
  if (regel.length <= MAX) return regel;

  let resultaat = "";
  let rest = regel;
  let eerste = true;

  while (rest.length > 0) {
    const limiet = eerste ? MAX : MAX - 1;
    const stuk = rest.slice(0, limiet);
    resultaat += (eerste ? "" : "\r\n ") + stuk;
    rest = rest.slice(limiet);
    eerste = false;
  }

  return resultaat;
}

function buildVEvent(activiteit: IcsActiviteit, nu: Date): string[] {
  const regels: string[] = [];
  const uid = `activiteit-${activiteit.id}@biflier.com`;

  regels.push("BEGIN:VEVENT");
  regels.push(`UID:${uid}`);
  regels.push(`DTSTAMP:${formatUtc(nu)}`);

  if (activiteit.heleDag) {
    regels.push(`DTSTART;VALUE=DATE:${formatUtcDatumEnkel(activiteit.start)}`);
    // DTEND bij hele-dag-events is exclusief: de dag na de einddatum.
    const eindePlusEenDag = new Date(activiteit.einde);
    eindePlusEenDag.setUTCDate(eindePlusEenDag.getUTCDate() + 1);
    regels.push(`DTEND;VALUE=DATE:${formatUtcDatumEnkel(eindePlusEenDag)}`);
  } else {
    regels.push(`DTSTART:${formatUtc(activiteit.start)}`);
    regels.push(`DTEND:${formatUtc(activiteit.einde)}`);
  }

  regels.push(`SUMMARY:${icsEscape(activiteit.titel)}`);

  const beschrijvingDelen = [activiteit.soort.naamNl, activiteit.beschrijving].filter(Boolean);
  if (beschrijvingDelen.length > 0) {
    regels.push(`DESCRIPTION:${icsEscape(beschrijvingDelen.join("\\n\\n"))}`);
  }

  if (activiteit.locatie) {
    regels.push(`LOCATION:${icsEscape(activiteit.locatie)}`);
  }

  regels.push(`URL:https://biflier.com/activiteit/${activiteit.id}`);
  regels.push("END:VEVENT");

  return regels;
}

function buildVCalendar(activiteiten: IcsActiviteit[], opties: { calname: string }): string {
  const nu = new Date();
  const regels: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BifLier//Agenda//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(opties.calname)}`,
    "X-WR-TIMEZONE:Europe/Brussels",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const activiteit of activiteiten) {
    regels.push(...buildVEvent(activiteit, nu));
  }

  regels.push("END:VCALENDAR");

  return regels.map(foldLine).join("\r\n") + "\r\n";
}

export function buildAgendaIcs(activiteiten: IcsActiviteit[]): string {
  return buildVCalendar(activiteiten, { calname: "BifLier Agenda" });
}

export function buildActiviteitIcs(activiteit: IcsActiviteit): string {
  return buildVCalendar([activiteit], { calname: "BifLier Agenda" });
}
