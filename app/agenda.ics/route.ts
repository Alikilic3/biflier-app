import { NextResponse } from "next/server";
import { getActiviteitenVoorIcs } from "@/lib/activiteiten";
import { buildAgendaIcs } from "@/lib/ics";

export const revalidate = 3600;

export async function GET() {
  const activiteiten = await getActiviteitenVoorIcs();
  const ics = buildAgendaIcs(activiteiten);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agenda.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
