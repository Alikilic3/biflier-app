// Geen "server-only": deze module bevat pure stringopbouw (geen database of
// cache) en wordt zowel server- als client-side gebruikt (bv. de
// kopieerknop-component).

export const AGENDA_DOMEIN = "biflier.com";

export function formatUtc(datum: Date): string {
  return datum.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function formatUtcDatumEnkel(datum: Date): string {
  return datum.toISOString().slice(0, 10).replace(/-/g, "");
}

export function agendaIcsUrl(): string {
  return `https://${AGENDA_DOMEIN}/agenda.ics`;
}

export function agendaWebcalUrl(): string {
  return `webcal://${AGENDA_DOMEIN}/agenda.ics`;
}

export function activiteitIcsUrl(id: number): string {
  return `https://${AGENDA_DOMEIN}/agenda/${id}.ics`;
}

export function activiteitWebcalUrl(id: number): string {
  return `webcal://${AGENDA_DOMEIN}/agenda/${id}.ics`;
}

export function googleAbonnerenUrl(): string {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(agendaWebcalUrl())}`;
}

export function googleEventUrl(activiteit: {
  titel: string;
  start: Date;
  einde: Date;
  locatie?: string | null;
  beschrijving?: string | null;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: activiteit.titel,
    dates: `${formatUtc(activiteit.start)}/${formatUtc(activiteit.einde)}`,
  });

  if (activiteit.beschrijving) params.set("details", activiteit.beschrijving);
  if (activiteit.locatie) params.set("location", activiteit.locatie);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
