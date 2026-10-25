import Link from "next/link";
import { requireEigenaar } from "@/lib/dal";
import { getSoorten } from "@/lib/soorten";
import ActiviteitForm, { LEGE_WAARDEN } from "@/app/beheer/agenda/ActiviteitForm";
import { maakActiviteit } from "@/app/beheer/agenda/actions";

export default async function NieuweActiviteitPagina() {
  await requireEigenaar();
  const soorten = await getSoorten(true);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/beheer/agenda"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[#14231a] no-underline"
      >
        ← Terug naar agendabeheer
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[#14231a]">Nieuwe activiteit</h1>
      <ActiviteitForm
        actie={maakActiviteit}
        initieel={{ ...LEGE_WAARDEN, soortId: soorten[0]?.id ?? 0 }}
        soorten={soorten}
        toonHerhaalOptie
      />
    </div>
  );
}
