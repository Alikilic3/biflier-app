"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DICT, type Taal, type WoordenBoek } from "@/lib/i18n";

type TaalContext = { taal: Taal; setTaal: (taal: Taal) => void; t: WoordenBoek };

const Context = createContext<TaalContext | null>(null);

const TAAL_COOKIE = "biflier_taal";

export default function LanguageProvider({
  initieelTaal,
  children,
}: {
  initieelTaal: Taal;
  children: React.ReactNode;
}) {
  // initieelTaal komt van de server (uit de cookie, zie lib/taal.ts), dus de
  // eerste render toont al de juiste taal — geen flits na hydratie.
  const [taal, setTaalState] = useState<Taal>(initieelTaal);

  useEffect(() => {
    document.documentElement.lang = taal;
  }, [taal]);

  function setTaal(nieuw: Taal) {
    setTaalState(nieuw);
    document.cookie = `${TAAL_COOKIE}=${nieuw}; path=/; max-age=31536000; SameSite=Lax`;
  }

  const waarde = useMemo<TaalContext>(() => ({ taal, setTaal, t: DICT[taal] }), [taal]);

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}

export function useTaal(): TaalContext {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useTaal moet binnen een LanguageProvider gebruikt worden.");
  }
  return ctx;
}
