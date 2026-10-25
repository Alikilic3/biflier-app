import { NextResponse } from "next/server";
import { getActiviteitVoorIcs } from "@/lib/activiteiten";
import { buildActiviteitIcs } from "@/lib/ics";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ idIcs: string }> }
) {
  const { idIcs } = await params;
  const match = idIcs.match(/^(\d+)\.ics$/);

  if (!match) {
    return new NextResponse("Not found", { status: 404 });
  }

  const id = Number(match[1]);
  const activiteit = await getActiviteitVoorIcs(id);

  if (!activiteit) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ics = buildActiviteitIcs(activiteit);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="activiteit-${id}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
