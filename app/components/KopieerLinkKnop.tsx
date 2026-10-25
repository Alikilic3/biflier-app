"use client";

import { useState } from "react";

export default function KopieerLinkKnop({
  url,
  label = "Kopieer link",
  gekopieerdLabel = "Gekopieerd!",
}: {
  url: string;
  label?: string;
  gekopieerdLabel?: string;
}) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      // Clipboard-API kan geweigerd worden (bv. geen HTTPS); negeren is hier
      // veiliger dan de gebruiker een foutmelding te tonen voor iets kleins.
    }
  }

  return (
    <button
      type="button"
      onClick={kopieer}
      className="flex items-center justify-between gap-2 rounded-full border-[1.5px] border-[#6e7f74] bg-transparent px-[18px] text-sm font-semibold text-white"
      style={{ height: "52px" }}
    >
      <span>{gekopieerd ? gekopieerdLabel : label}</span>
      <span className="font-medium text-[#d5ddd7]">{url.replace(/^https?:\/\//, "")}</span>
    </button>
  );
}
