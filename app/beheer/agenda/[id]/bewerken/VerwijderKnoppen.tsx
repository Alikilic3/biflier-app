"use client";

import { verwijderActiviteit } from "@/app/beheer/agenda/actions";

export default function VerwijderKnoppen({
  id,
  titel,
  reeksAantal,
}: {
  id: number;
  titel: string;
  reeksAantal: number | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form
        action={verwijderActiviteit.bind(null, id, "deze")}
        onSubmit={(e) => {
          if (!confirm(`"${titel}" verwijderen?`)) e.preventDefault();
        }}
      >
        <button
          type="submit"
          className="h-11 rounded-full border-[1.5px] border-red-600 px-5 text-sm font-semibold text-red-700"
        >
          Verwijder enkel deze activiteit
        </button>
      </form>

      {reeksAantal != null && (
        <form
          action={verwijderActiviteit.bind(null, id, "reeks")}
          onSubmit={(e) => {
            if (!confirm(`De hele reeks verwijderen? Dit verwijdert ${reeksAantal} activiteiten.`)) {
              e.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white"
          >
            Verwijder hele reeks ({reeksAantal})
          </button>
        </form>
      )}
    </div>
  );
}
