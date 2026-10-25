"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { maakSoort, bewerkSoort, verwijderSoort } from "@/app/beheer/soorten/actions";
import { SOORT_KLEUREN, type Soort } from "@/lib/soort-types";
import type { Taal } from "@/lib/i18n";

type SoortTekst = {
  nieuw: string;
  wijzigen: string;
  naamNl: string;
  naamTr: string;
  kleur: string;
  wie: string;
  iedereen: string;
  leiding: string;
  opslaan: string;
  bezig: string;
  annuleren: string;
  verwijderen: string;
  overigNotitie: string;
  verwijderBevestiging: (naam: string) => string;
};

const TEKST: Record<Taal, SoortTekst> = {
  nl: {
    nieuw: "Nieuwe soort",
    wijzigen: "Soort wijzigen",
    naamNl: "Naam in het Nederlands",
    naamTr: "Naam in het Turks",
    kleur: "Kleur",
    wie: "Wie ziet dit",
    iedereen: "Iedereen",
    leiding: "Alleen leiding",
    opslaan: "Opslaan",
    bezig: "Bezig…",
    annuleren: "Annuleren",
    verwijderen: "Verwijderen",
    overigNotitie: "“Overig” kan niet worden verwijderd: activiteiten van verwijderde soorten komen hier terecht.",
    verwijderBevestiging: (naam: string) => `"${naam}" verwijderen? Activiteiten van deze soort gaan naar "Overig".`,
  },
  tr: {
    nieuw: "Yeni tür",
    wijzigen: "Türü düzenle",
    naamNl: "Felemenkçe ad",
    naamTr: "Türkçe ad",
    kleur: "Renk",
    wie: "Kimler görsün",
    iedereen: "Herkes",
    leiding: "Sadece yönetim",
    opslaan: "Kaydet",
    bezig: "Bekleyin…",
    annuleren: "İptal",
    verwijderen: "Sil",
    overigNotitie: "“Diğer” silinemez: silinen türlerin etkinlikleri buraya taşınır.",
    verwijderBevestiging: (naam: string) => `"${naam}" silinsin mi? Bu türün etkinlikleri "Diğer"e taşınır.`,
  },
};

export default function SoortBeheerPanel({
  soort,
  taal,
  onKlaar,
  onAnnuleren,
}: {
  soort: Soort | null;
  taal: Taal;
  onKlaar: () => void;
  onAnnuleren: () => void;
}) {
  const router = useRouter();
  const tx = TEKST[taal];
  const [kleur, setKleur] = useState(soort?.kleur ?? SOORT_KLEUREN[0]);
  const [zichtbaarheid, setZichtbaarheid] = useState(soort?.zichtbaarheid ?? "publiek");
  const [verwijderBezig, setVerwijderBezig] = useState(false);
  const [verwijderFout, setVerwijderFout] = useState<string | null>(null);

  const [fout, formAction, bezig] = useActionState<string | undefined, FormData>(
    async (_prevState, formData) => {
      const resultaat = soort
        ? await bewerkSoort(soort.id, _prevState, formData)
        : await maakSoort(_prevState, formData);
      if (!resultaat) {
        router.refresh();
        onKlaar();
        return undefined;
      }
      return resultaat;
    },
    undefined
  );

  async function verwijder() {
    if (!soort) return;
    if (!confirm(tx.verwijderBevestiging(soort.naamNl))) {
      return;
    }
    setVerwijderBezig(true);
    setVerwijderFout(null);
    const resultaat = await verwijderSoort(soort.id);
    setVerwijderBezig(false);
    if (resultaat) {
      setVerwijderFout(resultaat);
    } else {
      router.refresh();
      onKlaar();
    }
  }

  const isOverig = soort?.kernSoort ?? false;

  return (
    <div className="grid gap-3 rounded-2xl border border-[#dfe3dd] bg-white p-4">
      <b className="text-[15px] text-[#14231a]">{soort ? tx.wijzigen : tx.nieuw}</b>
      <form action={formAction} className="grid gap-3">
        {fout && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{fout}</p>}
        {verwijderFout && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{verwijderFout}</p>
        )}

        <label className="grid gap-1 text-sm font-semibold text-[#14231a]">
          {tx.naamNl}
          <input
            name="naamNl"
            type="text"
            required
            defaultValue={soort?.naamNl ?? ""}
            className="h-12 rounded-xl border-[1.5px] border-[#cfd5cd] px-3 text-[15px] font-normal outline-none focus:border-[#0b853f]"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-[#14231a]">
          {tx.naamTr}
          <input
            name="naamTr"
            type="text"
            required
            defaultValue={soort?.naamTr ?? ""}
            className="h-12 rounded-xl border-[1.5px] border-[#cfd5cd] px-3 text-[15px] font-normal outline-none focus:border-[#0b853f]"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {SOORT_KLEUREN.map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k}
              aria-pressed={kleur === k}
              onClick={() => setKleur(k)}
              className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-white"
              style={{ background: k, border: `3px solid ${kleur === k ? "#14231a" : "transparent"}` }}
            >
              {kleur === k ? "✓" : ""}
            </button>
          ))}
        </div>
        <input type="hidden" name="kleur" value={kleur} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setZichtbaarheid("publiek")}
            aria-pressed={zichtbaarheid === "publiek"}
            className="h-11 flex-1 rounded-full border-[1.5px] px-3 text-sm font-semibold"
            style={
              zichtbaarheid === "publiek"
                ? { background: "#14231a", color: "#fff", borderColor: "#14231a" }
                : { borderColor: "#cfd5cd" }
            }
          >
            {tx.iedereen}
          </button>
          <button
            type="button"
            onClick={() => setZichtbaarheid("leiding")}
            aria-pressed={zichtbaarheid === "leiding"}
            className="h-11 flex-1 rounded-full border-[1.5px] px-3 text-sm font-semibold"
            style={
              zichtbaarheid === "leiding"
                ? { background: "#14231a", color: "#fff", borderColor: "#14231a" }
                : { borderColor: "#cfd5cd" }
            }
          >
            {tx.leiding}
          </button>
        </div>
        <input type="hidden" name="zichtbaarheid" value={zichtbaarheid} />

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={bezig}
            className="h-11 rounded-full bg-[#14231a] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {bezig ? tx.bezig : tx.opslaan}
          </button>
          <button
            type="button"
            onClick={onAnnuleren}
            className="h-11 rounded-full border-[1.5px] border-[#cfd5cd] bg-white px-5 text-sm font-semibold text-[#14231a]"
          >
            {tx.annuleren}
          </button>
          {soort && !isOverig && (
            <button
              type="button"
              onClick={verwijder}
              disabled={verwijderBezig}
              className="h-11 rounded-full px-5 text-sm font-semibold text-[#9b2c1f] disabled:opacity-60"
            >
              {verwijderBezig ? tx.bezig : tx.verwijderen}
            </button>
          )}
        </div>

        {isOverig && <p className="text-sm text-[#4f5b53]">{tx.overigNotitie}</p>}
      </form>
    </div>
  );
}
