"use client";

import Image from "next/image";
import { useTaal } from "@/app/components/LanguageProvider";
import type { Taal } from "@/lib/i18n";

type OnderhoudTekst = {
  titel: string;
  tekst: string;
  contact: string;
};

const TEKST: Record<Taal, OnderhoudTekst> = {
  nl: {
    titel: "We werken aan onze nieuwe agenda",
    tekst: "BifLier is tijdelijk niet beschikbaar. We zijn snel weer terug.",
    contact: "Vragen? [e-mail of telefoonnummer]",
  },
  tr: {
    titel: "Yeni ajandamız üzerinde çalışıyoruz",
    tekst: "BifLier geçici olarak kullanılamıyor. Kısa süre içinde geri döneceğiz.",
    contact: "Sorularınız mı var? [e-posta veya telefon numarası]",
  },
};

export default function OnderhoudPagina() {
  const { taal, setTaal } = useTaal();
  const tx = TEKST[taal];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f5f1] px-6 py-16 text-center text-[#14231a]">
      <Image src="/logo.svg" alt="BIF" width={188} height={57} priority className="h-12 w-auto" />

      <div
        role="group"
        aria-label="Taal / Dil"
        className="inline-flex rounded-full border-[1.5px] border-[#cfd5cd] bg-white p-0.5"
      >
        <button
          type="button"
          onClick={() => setTaal("nl")}
          aria-pressed={taal === "nl"}
          className="h-11 min-w-[48px] rounded-full px-3 text-sm font-bold"
          style={taal === "nl" ? { background: "#14231a", color: "#ffffff" } : undefined}
        >
          NL
        </button>
        <button
          type="button"
          onClick={() => setTaal("tr")}
          aria-pressed={taal === "tr"}
          className="h-11 min-w-[48px] rounded-full px-3 text-sm font-bold"
          style={taal === "tr" ? { background: "#14231a", color: "#ffffff" } : undefined}
        >
          TR
        </button>
      </div>

      <div className="flex max-w-md flex-col gap-3">
        <h1 className="m-0 text-[28px] font-bold leading-tight sm:text-[34px]">{tx.titel}</h1>
        <p className="m-0 text-[16px] leading-relaxed text-[#4f5b53]">{tx.tekst}</p>
      </div>

      <span aria-hidden className="onderhoud-stip mt-2 block h-2.5 w-2.5 rounded-full bg-[#0b853f]" />

      <p className="m-0 text-sm text-[#4f5b53]">{tx.contact}</p>
    </main>
  );
}
