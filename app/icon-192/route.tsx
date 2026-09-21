import { renderAppIcon } from "@/lib/app-icon";

export async function GET() {
  return renderAppIcon(192);
}
