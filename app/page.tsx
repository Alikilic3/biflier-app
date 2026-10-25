import { getBeheerder, isEigenaar } from "@/lib/dal";
import { getActiviteiten } from "@/lib/activiteiten";
import { getSoorten } from "@/lib/soorten";
import AgendaView from "@/app/components/AgendaView";

export default async function HomePage() {
  const beheerder = await getBeheerder();
  const leiding = beheerder != null;

  const [activiteiten, soorten, eigenaar] = await Promise.all([
    getActiviteiten(leiding),
    getSoorten(leiding),
    isEigenaar(),
  ]);

  return <AgendaView activiteiten={activiteiten} soorten={soorten} leiding={leiding} isEigenaar={eigenaar} />;
}
