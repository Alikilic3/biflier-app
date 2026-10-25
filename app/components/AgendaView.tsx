"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActiviteitKort } from "@/lib/activiteit-types";
import { soortNaam, type Soort } from "@/lib/soort-types";
import { vertaaldVeld } from "@/lib/vertaling";
import { agendaIcsUrl, agendaWebcalUrl, googleAbonnerenUrl } from "@/lib/agenda-links";
import KopieerLinkKnop from "@/app/components/KopieerLinkKnop";
import SoortBeheerPanel from "@/app/components/SoortBeheerPanel";
import { useTaal } from "@/app/components/LanguageProvider";
import type { Taal, WoordenBoek } from "@/lib/i18n";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function brusselsSleutel(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });
}

function brusselsTijd(d: Date): string {
  return d.toLocaleTimeString("nl-BE", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoofdletter(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

// Sleutel = "YYYY-MM-DD" Brussels-kalenderdatum. Al het datumrekenen hieronder
// gebeurt met Date.UTC-middaginstanties, zodat het resultaat niet afhangt van
// de tijdzone van de bezoekers browser (die kan overal wonen).
function naarUtcMiddag(sleutel: string): Date {
  const [j, m, d] = sleutel.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, d, 12));
}
function vanUtcMiddag(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function dagErbij(sleutel: string, n: number): string {
  const d = naarUtcMiddag(sleutel);
  d.setUTCDate(d.getUTCDate() + n);
  return vanUtcMiddag(d);
}
function eersteVanMaand(sleutel: string, maandOffset: number): string {
  const d = naarUtcMiddag(sleutel);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + maandOffset);
  return vanUtcMiddag(d);
}
function maandagVan(sleutel: string): string {
  const d = naarUtcMiddag(sleutel);
  return dagErbij(sleutel, -((d.getUTCDay() + 6) % 7));
}
function minutenSindsMidnacht(tijd: string): number {
  const [u, m] = tijd.split(":").map(Number);
  return u * 60 + m;
}
function vandaagBrussel(): string {
  return brusselsSleutel(new Date());
}
function isoWeekNummer(sleutel: string): number {
  const datum = naarUtcMiddag(sleutel);
  const d = new Date(datum.getTime());
  d.setUTCDate(d.getUTCDate() - ((datum.getUTCDay() + 6) % 7) + 3);
  const donderdag = d.getTime();
  d.setUTCMonth(0, 1);
  if (d.getUTCDay() !== 4) d.setUTCMonth(0, 1 + (((4 - d.getUTCDay()) + 7) % 7));
  return 1 + Math.round((donderdag - d.getTime()) / 604_800_000);
}

function rasterDagen(jaar: number, maand: number): Date[] {
  const eersteVanMaand = new Date(Date.UTC(jaar, maand, 1));
  const offsetMaandag = (eersteVanMaand.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(jaar, maand, 1 - offsetMaandag));

  const laatsteDag = new Date(Date.UTC(jaar, maand + 1, 0)).getUTCDate();
  const laatsteVanMaand = new Date(Date.UTC(jaar, maand, laatsteDag));
  const offsetZondag = (7 - laatsteVanMaand.getUTCDay()) % 7;
  const totEnMet = new Date(Date.UTC(jaar, maand, laatsteDag + offsetZondag));

  const aantal = Math.round((totEnMet.getTime() - start.getTime()) / 86_400_000) + 1;
  return Array.from({ length: aantal }, (_, i) => new Date(start.getTime() + i * 86_400_000));
}

// Zachte tint i.p.v. een volle kleur: achtergrond = kleur + alpha "24" (hex),
// dikke gekleurde rand links, donkere leestekst — zo blijft contrast hoog.
function tintStijl(kleur: string): React.CSSProperties {
  return { background: `${kleur}24`, borderLeft: `4px solid ${kleur}` };
}

type WeergaveDesktop = "dag" | "week" | "maand" | "jaar";
type WeergaveMobiel = "lijst" | "maand" | "dag1" | "dag2" | "dag3";
const OPSLAG_DESKTOP = "biflier-agenda-weergave-desktop";
const OPSLAG_MOBIEL = "biflier-agenda-weergave-mobiel";

function desktopUitOpslag(): WeergaveDesktop {
  if (typeof window === "undefined") return "week";
  const v = localStorage.getItem(OPSLAG_DESKTOP);
  return v === "dag" || v === "week" || v === "maand" || v === "jaar" ? v : "week";
}
function mobielUitOpslag(): WeergaveMobiel {
  if (typeof window === "undefined") return "lijst";
  const v = localStorage.getItem(OPSLAG_MOBIEL);
  return v === "lijst" || v === "maand" || v === "dag1" || v === "dag2" || v === "dag3" ? v : "lijst";
}

function nDagenDesktop(v: WeergaveDesktop): number {
  return v === "dag" ? 1 : v === "week" ? 7 : 0;
}
function nDagenMobiel(v: WeergaveMobiel): number {
  return v === "dag1" ? 1 : v === "dag2" ? 2 : v === "dag3" ? 3 : 0;
}

type ChipDef = { key: number | "alle"; label: string; kleur: string; soort: Soort | null };

export default function AgendaView({
  activiteiten,
  soorten,
  leiding,
  isEigenaar,
}: {
  activiteiten: ActiviteitKort[];
  soorten: Soort[];
  leiding: boolean;
  isEigenaar: boolean;
}) {
  const { t, taal } = useTaal();
  const vandaag = vandaagBrussel();

  const [weergaveDesktop, setWeergaveDesktopState] = useState<WeergaveDesktop>(desktopUitOpslag);
  const [weergaveMobiel, setWeergaveMobielState] = useState<WeergaveMobiel>(mobielUitOpslag);
  const [anchor, setAnchor] = useState(vandaag);
  const [sel, setSel] = useState(vandaag);
  const [filter, setFilter] = useState<number | "alle">("alle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [soortenBeheerModus, setSoortenBeheerModus] = useState(false);
  const [bewerkteSoort, setBewerkteSoort] = useState<Soort | "nieuw" | null>(null);
  const [drawerEvent, setDrawerEvent] = useState<ActiviteitKort | null>(null);

  function setWeergaveDesktop(v: WeergaveDesktop) {
    setWeergaveDesktopState(v);
    localStorage.setItem(OPSLAG_DESKTOP, v);
    setMenuOpen(false);
  }
  function setWeergaveMobiel(v: WeergaveMobiel) {
    setWeergaveMobielState(v);
    localStorage.setItem(OPSLAG_MOBIEL, v);
    setMenuOpen(false);
  }

  function sluitSoortenBeheer() {
    setBewerkteSoort(null);
  }

  const zichtbaar = activiteiten.filter((a) => filter === "alle" || a.soort.id === filter);

  const chips: ChipDef[] = [{ key: "alle", label: t.alles, kleur: "#14231a", soort: null }];
  for (const soort of soorten) {
    if (soort.zichtbaarheid === "leiding" && !leiding) continue;
    chips.push({ key: soort.id, label: soortNaam(soort, taal), kleur: soort.kleur, soort });
  }

  const eventsPerDag = new Map<string, ActiviteitKort[]>();
  for (const a of zichtbaar) {
    const sleutel = brusselsSleutel(a.start);
    const lijst = eventsPerDag.get(sleutel) ?? [];
    lijst.push(a);
    eventsPerDag.set(sleutel, lijst);
  }

  // activiteiten is al op start gesorteerd uit getActiviteiten(); hier enkel
  // nog filteren op "nog niet afgelopen" en de eerste 4 nemen.
  const upcoming = zichtbaar.filter((a) => brusselsSleutel(a.einde) >= vandaag).slice(0, 4);

  function gaDesktop(delta: number) {
    if (weergaveDesktop === "maand") {
      setAnchor((a) => {
        const nieuw = eersteVanMaand(a, delta);
        return nieuw.slice(0, 7) === vandaag.slice(0, 7) ? vandaag : nieuw;
      });
      setSel((s) => s);
    } else if (weergaveDesktop === "jaar") {
      setAnchor((a) => eersteVanMaand(a, 12 * delta));
    } else {
      setAnchor((a) => dagErbij(a, nDagenDesktop(weergaveDesktop) * delta));
    }
  }
  function gaMobiel(delta: number) {
    if (weergaveMobiel === "maand") {
      setAnchor((a) => {
        const nieuw = eersteVanMaand(a, delta);
        return nieuw.slice(0, 7) === vandaag.slice(0, 7) ? vandaag : nieuw;
      });
    } else if (weergaveMobiel === "lijst") {
      setAnchor((a) => dagErbij(a, 7 * delta));
    } else {
      setAnchor((a) => dagErbij(a, nDagenMobiel(weergaveMobiel) * delta));
    }
  }
  function naarVandaag() {
    setAnchor(vandaag);
    setSel(vandaag);
  }

  function dagLabel(sleutel: string): string {
    const d = naarUtcMiddag(sleutel);
    const naam = `${hoofdletter(t.dagVol[d.getUTCDay()])} ${d.getUTCDate()} ${t.maanden[d.getUTCMonth()]}`;
    return sleutel === vandaag ? `${t.vandaag} · ${naam}` : naam;
  }

  function titelVoor(weergave: WeergaveDesktop | WeergaveMobiel, mobielTitel: boolean): [string, string] {
    const a = naarUtcMiddag(anchor);
    if (weergave === "maand") return [`${hoofdletter(t.maanden[a.getUTCMonth()])} ${a.getUTCFullYear()}`, ""];
    if (weergave === "jaar") return [`${a.getUTCFullYear()}`, ""];
    if (weergave === "lijst") return [t.agenda, `${hoofdletter(t.maanden[a.getUTCMonth()])} ${a.getUTCFullYear()}`];
    if (weergave === "dag" || weergave === "dag1") {
      const basis = `${hoofdletter(t.dagVol[a.getUTCDay()])} ${a.getUTCDate()} ${t.maanden[a.getUTCMonth()]}`;
      return mobielTitel ? [basis, `${a.getUTCFullYear()}`] : [`${basis} ${a.getUTCFullYear()}`, ""];
    }
    const n = weergave === "week" ? 7 : weergave === "dag2" ? 2 : 3;
    const startSleutel = weergave === "week" ? maandagVan(anchor) : anchor;
    const start = naarUtcMiddag(startSleutel);
    const eind = naarUtcMiddag(dagErbij(startSleutel, n - 1));
    const links = `${start.getUTCDate()}${start.getUTCMonth() !== eind.getUTCMonth() ? " " + t.maandKort[start.getUTCMonth()] : ""}`;
    const basis = `${links} – ${eind.getUTCDate()} ${t.maandKort[eind.getUTCMonth()]}`;
    return mobielTitel ? [basis, `${eind.getUTCFullYear()}`] : [`${basis} ${eind.getUTCFullYear()}`, ""];
  }

  function renderMaandMobiel() {
    const eersteSleutel = eersteVanMaand(anchor, 0);
    const eersteDag = naarUtcMiddag(eersteSleutel);
    const dezeMaand = eersteDag.getUTCMonth();
    const dagenMaand = rasterDagen(eersteDag.getUTCFullYear(), dezeMaand);
    return (
      <>
        <div className="overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white">
          <div className="grid grid-cols-7">
            {t.wk.map((w) => (
              <div key={w} className="bg-[#fbfaf7] py-2 text-center text-[11px] font-semibold uppercase text-[#4f5b53]">
                {w}
              </div>
            ))}
            {dagenMaand.map((dag) => {
              const sleutel = vanUtcMiddag(dag);
              const inMaand = dag.getUTCMonth() === dezeMaand;
              const isVandaag = sleutel === vandaag;
              const isSel = sleutel === sel;
              const events = eventsPerDag.get(sleutel) ?? [];
              const kleuren: string[] = [];
              const gezien = new Set<number>();
              for (const e of events) {
                if (!gezien.has(e.soort.id)) {
                  gezien.add(e.soort.id);
                  kleuren.push(e.soort.kleur);
                }
              }
              return (
                <button
                  key={sleutel}
                  type="button"
                  onClick={() => setSel(sleutel)}
                  className="flex h-[52px] flex-col items-center gap-1 pt-1"
                  style={{ opacity: inMaand ? 1 : 0.45 }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-semibold"
                    style={{
                      background: isVandaag ? "#0b853f" : "transparent",
                      color: isVandaag ? "#ffffff" : "#14231a",
                      boxShadow: !isVandaag && isSel ? "inset 0 0 0 2px #14231a" : undefined,
                    }}
                  >
                    {dag.getUTCDate()}
                  </span>
                  <span className="flex h-1.5 gap-0.5">
                    {kleuren.slice(0, 3).map((kleur, i) => (
                      <i key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: kleur }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <h2 className="m-0 text-sm font-bold tracking-wide text-[#4f5b53]">{dagLabel(sel)}</h2>
          {(eventsPerDag.get(sel) ?? []).length === 0 ? (
            <p className="rounded-2xl border border-[#dfe3dd] bg-white px-5 py-8 text-center text-sm text-[#4f5b53]">
              {t.geenDag}
            </p>
          ) : (
            (eventsPerDag.get(sel) ?? []).map((ev) => <EventRij key={ev.id} ev={ev} t={t} taal={taal} />)
          )}
        </div>
      </>
    );
  }

  function renderMaandDesktop() {
    const eersteSleutel = eersteVanMaand(anchor, 0);
    const eersteDag = naarUtcMiddag(eersteSleutel);
    const dezeMaand = eersteDag.getUTCMonth();
    const dagenMaand = rasterDagen(eersteDag.getUTCFullYear(), dezeMaand);
    return (
      <div className="grid grid-cols-7">
        <div className="sticky top-0 z-[5] col-span-7 grid grid-cols-7 bg-[#fbfaf7]">
          {t.wk.map((w) => (
            <div key={w} className="border-b border-[#dfe3dd] p-3 text-[12px] font-semibold uppercase text-[#4f5b53]">
              {w}
            </div>
          ))}
        </div>
        {dagenMaand.map((dag) => {
          const sleutel = vanUtcMiddag(dag);
          const inMaand = dag.getUTCMonth() === dezeMaand;
          const isVandaag = sleutel === vandaag;
          const events = eventsPerDag.get(sleutel) ?? [];
          return (
            <div
              key={sleutel}
              className="box-border flex min-h-[120px] min-w-0 flex-col gap-1 border-b border-r border-[#dfe3dd] p-1.5"
              style={{ background: inMaand ? "#ffffff" : "#f3f2ee" }}
            >
              <button
                type="button"
                onClick={() => {
                  setAnchor(sleutel);
                  setSel(sleutel);
                  setWeergaveDesktop("dag");
                }}
                className="mb-0.5 flex h-7 min-w-7 items-center justify-center self-start rounded-full text-sm font-semibold"
                style={{
                  color: isVandaag ? "#ffffff" : inMaand ? "#14231a" : "#5f6a63",
                  background: isVandaag ? "#0b853f" : "transparent",
                }}
              >
                {dag.getUTCDate()}
              </button>
              {events.slice(0, 3).map((ev) => (
                <EventTint key={ev.id} ev={ev} taal={taal} onKies={() => setDrawerEvent(ev)} />
              ))}
              {events.length > 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setAnchor(sleutel);
                    setSel(sleutel);
                    setWeergaveDesktop("dag");
                  }}
                  className="text-left text-xs text-[#4f5b53]"
                >
                  + {events.length - 3} {t.meer}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderJaar() {
    const jaarGetal = naarUtcMiddag(anchor).getUTCFullYear();
    return (
      <div className="grid gap-3.5 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
        {Array.from({ length: 12 }, (_, m) => {
          const eersteDag = new Date(Date.UTC(jaarGetal, m, 1, 12));
          const offset = (eersteDag.getUTCDay() + 6) % 7;
          const dagenInMaand = new Date(Date.UTC(jaarGetal, m + 1, 0)).getUTCDate();
          return (
            <div key={m} className="rounded-2xl border border-[#dfe3dd] bg-white p-3">
              <button
                type="button"
                onClick={() => {
                  setAnchor(vanUtcMiddag(eersteDag));
                  setWeergaveDesktop("maand");
                }}
                className="text-[16px] font-bold"
              >
                {hoofdletter(t.maanden[m])}
              </button>
              <div className="grid grid-cols-7 text-center text-[11px] text-[#4f5b53]">
                {t.wk.map((w) => (
                  <span key={w}>{w[0]}</span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 42 }, (_, i) => {
                  const dagNr = i - offset + 1;
                  if (dagNr < 1 || dagNr > dagenInMaand) return <span key={i} />;
                  const sleutel = `${jaarGetal}-${pad(m + 1)}-${pad(dagNr)}`;
                  const isVandaag = sleutel === vandaag;
                  const events = eventsPerDag.get(sleutel) ?? [];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAnchor(sleutel);
                        setSel(sleutel);
                        setWeergaveDesktop("dag");
                      }}
                      className="flex h-8 flex-col items-center justify-center gap-0.5 rounded-lg text-[13px]"
                      style={{ background: isVandaag ? "#0b853f" : "transparent", color: isVandaag ? "#fff" : "inherit" }}
                    >
                      {dagNr}
                      <i
                        className="h-[5px] w-[5px] rounded-full"
                        style={{ background: events.length ? (isVandaag ? "#fff" : events[0].soort.kleur) : "transparent" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderLijst() {
    const groepen: { sleutel: string; events: ActiviteitKort[] }[] = [];
    for (let i = 0; i < 30 && groepen.length < 6; i++) {
      const sleutel = dagErbij(anchor, i);
      const events = (eventsPerDag.get(sleutel) ?? []).slice().sort((a, b) => a.start.getTime() - b.start.getTime());
      if (events.length === 0) continue;
      groepen.push({ sleutel, events });
    }
    if (groepen.length === 0) {
      return (
        <p className="rounded-2xl border border-[#dfe3dd] bg-white px-5 py-8 text-center text-sm text-[#4f5b53]">
          {t.geenDag}
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-5">
        {groepen.map((g) => (
          <section key={g.sleutel} className="flex flex-col gap-2">
            <h2 className="m-0 text-sm font-bold tracking-wide text-[#4f5b53]">{dagLabel(g.sleutel)}</h2>
            {g.events.map((ev) => (
              <EventRij key={ev.id} ev={ev} t={t} taal={taal} />
            ))}
          </section>
        ))}
      </div>
    );
  }

  function renderTimeline(n: number, startSleutel: string, hh: number, metKlikDrawer: boolean) {
    const dagen = Array.from({ length: n }, (_, i) => dagErbij(startSleutel, i));
    const kolomBreedte = n > 1 ? "120px" : "0";
    const minBreedte = n > 1 ? 56 + n * 120 : undefined;
    const nu = new Date();
    const nuMinuten = Number(
      nu.toLocaleTimeString("en-GB", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" }).split(":")[0]
    ) * 60 +
      Number(
        nu.toLocaleTimeString("en-GB", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" }).split(":")[1]
      );

    return (
      <div className="overflow-x-auto">
        <div style={{ minWidth: minBreedte }}>
          <div
            className="sticky top-0 z-[5] grid border-b border-[#dfe3dd] bg-white"
            style={{ gridTemplateColumns: `56px repeat(${n}, minmax(${kolomBreedte},1fr))` }}
          >
            <div />
            {dagen.map((sleutel) => {
              const d = naarUtcMiddag(sleutel);
              const isVandaag = sleutel === vandaag;
              const heleDagEvents = (eventsPerDag.get(sleutel) ?? []).filter((e) => e.heleDag);
              return (
                <div
                  key={sleutel}
                  className="flex flex-col items-center gap-1 border-l border-[#e6e9e4] px-1 py-2"
                  style={{ background: isVandaag ? "#f4faf6" : "#ffffff" }}
                >
                  <span className="text-[12px] font-semibold uppercase text-[#4f5b53]">{t.dagKort[d.getUTCDay()]}</span>
                  <b
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[18px] font-bold"
                    style={{ background: isVandaag ? "#0b853f" : "transparent", color: isVandaag ? "#fff" : "#14231a" }}
                  >
                    {d.getUTCDate()}
                  </b>
                  {heleDagEvents.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => (metKlikDrawer ? setDrawerEvent(e) : undefined)}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-center text-[11px] text-[#14231a]"
                      style={tintStijl(e.soort.kleur)}
                    >
                      {vertaaldVeld(taal, e.titel, e.titelTr)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${n}, minmax(${kolomBreedte},1fr))` }}>
            <div>
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} style={{ height: hh }} className="pr-1.5 text-right text-[11px] text-[#4f5b53]">
                  <span className="relative -top-[7px]">{pad(i + 8)}:00</span>
                </div>
              ))}
            </div>
            {dagen.map((sleutel) => {
              const isVandaag = sleutel === vandaag;
              return (
                <div
                  key={sleutel}
                  className="relative border-l border-[#e6e9e4]"
                  style={{
                    height: 15 * hh,
                    background: isVandaag ? "#f4faf6" : undefined,
                    backgroundImage: `repeating-linear-gradient(to bottom, #e6e9e4 0, #e6e9e4 1px, transparent 1px, transparent ${hh}px)`,
                  }}
                >
                  {isVandaag && nuMinuten >= 480 && nuMinuten <= 1380 && (
                    <div
                      className="absolute left-0 right-0 z-[2] h-[2px] bg-[#d92d20]"
                      style={{ top: ((nuMinuten - 480) * hh) / 60 }}
                    >
                      <span className="absolute -left-[4px] -top-[3px] h-2 w-2 rounded-full bg-[#d92d20]" />
                    </div>
                  )}
                  {(eventsPerDag.get(sleutel) ?? [])
                    .filter((ev) => !ev.heleDag)
                    .map((ev) => {
                      const s = minutenSindsMidnacht(brusselsTijd(ev.start));
                      const e = minutenSindsMidnacht(brusselsTijd(ev.einde));
                      const top = ((s - 480) * hh) / 60 + 1;
                      const hoogte = Math.max(26, ((e - s) * hh) / 60 - 2);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => (metKlikDrawer ? setDrawerEvent(ev) : undefined)}
                          className="absolute left-0.5 right-0.5 overflow-hidden rounded-r-lg py-1 pl-2 pr-1.5 text-left text-[12px] leading-tight text-[#14231a]"
                          style={{ top, height: hoogte, ...tintStijl(ev.soort.kleur) }}
                        >
                          <b>{vertaaldVeld(taal, ev.titel, ev.titelTr)}</b>
                          <br />
                          {brusselsTijd(ev.start)} – {brusselsTijd(ev.einde)}
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderTimelineMobielMetLink(n: number, startSleutel: string) {
    // Mobiel navigeert bij een klik op een activiteit naar de volledige
    // detailpagina (geen 360px-lade — die past niet op een smal scherm en
    // wordt in het prototype zelf ook enkel op desktop getoond).
    const dagen = Array.from({ length: n }, (_, i) => dagErbij(startSleutel, i));
    const hh = 48;
    return (
      <div className="overflow-x-auto rounded-2xl border border-[#dfe3dd] bg-white">
        <div style={{ minWidth: n > 1 ? 56 + n * 120 : undefined }}>
          <div className="grid border-b border-[#dfe3dd]" style={{ gridTemplateColumns: `56px repeat(${n}, minmax(${n > 1 ? "120px" : "0"},1fr))` }}>
            <div />
            {dagen.map((sleutel) => {
              const d = naarUtcMiddag(sleutel);
              const isVandaag = sleutel === vandaag;
              return (
                <div key={sleutel} className="flex flex-col items-center gap-1 border-l border-[#e6e9e4] px-1 py-2">
                  <span className="text-[12px] font-semibold uppercase text-[#4f5b53]">{t.dagKort[d.getUTCDay()]}</span>
                  <b
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-bold"
                    style={{ background: isVandaag ? "#0b853f" : "transparent", color: isVandaag ? "#fff" : "#14231a" }}
                  >
                    {d.getUTCDate()}
                  </b>
                </div>
              );
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${n}, minmax(${n > 1 ? "120px" : "0"},1fr))` }}>
            <div>
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} style={{ height: hh }} className="pr-1.5 text-right text-[11px] text-[#4f5b53]">
                  <span className="relative -top-[7px]">{pad(i + 8)}:00</span>
                </div>
              ))}
            </div>
            {dagen.map((sleutel) => (
              <div
                key={sleutel}
                className="relative border-l border-[#e6e9e4]"
                style={{
                  height: 15 * hh,
                  backgroundImage: `repeating-linear-gradient(to bottom, #e6e9e4 0, #e6e9e4 1px, transparent 1px, transparent ${hh}px)`,
                }}
              >
                {(eventsPerDag.get(sleutel) ?? [])
                  .filter((ev) => !ev.heleDag)
                  .map((ev) => {
                    const s = minutenSindsMidnacht(brusselsTijd(ev.start));
                    const e = minutenSindsMidnacht(brusselsTijd(ev.einde));
                    const top = ((s - 480) * hh) / 60 + 1;
                    const hoogte = Math.max(26, ((e - s) * hh) / 60 - 2);
                    return (
                      <Link
                        key={ev.id}
                        href={`/activiteit/${ev.id}`}
                        className="absolute left-0.5 right-0.5 overflow-hidden rounded-r-lg py-1 pl-2 pr-1.5 text-left text-[12px] leading-tight text-[#14231a] no-underline"
                        style={{ top, height: hoogte, ...tintStijl(ev.soort.kleur) }}
                      >
                        <b>{vertaaldVeld(taal, ev.titel, ev.titelTr)}</b>
                        <br />
                        {brusselsTijd(ev.start)}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weergavesDesktop: { key: WeergaveDesktop; label: string }[] = [
    { key: "dag", label: t.dag },
    { key: "week", label: t.week },
    { key: "maand", label: t.maand },
    { key: "jaar", label: t.jaar },
  ];
  const weergavesMobiel: { key: WeergaveMobiel; label: string }[] = [
    { key: "lijst", label: t.lijst },
    { key: "maand", label: t.maand },
    { key: "dag1", label: t.d1 },
    { key: "dag2", label: t.d2 },
    { key: "dag3", label: t.d3 },
  ];

  const [titelDesktop] = titelVoor(weergaveDesktop, false);
  const [titelMobiel, subMobiel] = titelVoor(weergaveMobiel, true);
  const huidigeLabelDesktop = weergavesDesktop.find((w) => w.key === weergaveDesktop)?.label ?? "";
  const huidigeLabelMobiel = weergavesMobiel.find((w) => w.key === weergaveMobiel)?.label ?? "";

  function SidebarRows() {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="px-2.5 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-[#4f5b53]">{t.agenda}</div>
        {!soortenBeheerModus && (
          <button
            type="button"
            onClick={() => setFilter("alle")}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[15px] font-semibold"
            style={{ background: filter === "alle" ? "#ece9df" : "transparent" }}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white"
              style={{ background: "#14231a", opacity: filter === "alle" ? 1 : 0.35 }}
            >
              {filter === "alle" ? "✓" : ""}
            </span>
            {t.alles}
          </button>
        )}
        {chips.slice(1).map((chip) => {
          if (soortenBeheerModus) {
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setBewerkteSoort(chip.soort)}
                className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[15px] font-semibold"
                style={{
                  background: bewerkteSoort !== null && bewerkteSoort !== "nieuw" && bewerkteSoort.id === chip.key ? "#ece9df" : "transparent",
                }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white" style={{ background: chip.kleur }}>
                  ✎
                </span>
                {chip.label}
              </button>
            );
          }
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[15px] font-semibold"
              style={{ background: filter === chip.key ? "#ece9df" : "transparent" }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white"
                style={{ background: chip.kleur, opacity: filter === chip.key ? 1 : 0.35 }}
              >
                {filter === chip.key ? "✓" : ""}
              </span>
              {chip.label}
            </button>
          );
        })}
        {soortenBeheerModus && (
          <button
            type="button"
            onClick={() => setBewerkteSoort("nieuw")}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[15px] font-semibold"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-dashed border-[#14231a] text-[13px]">＋</span>
            {t.nieuweSoort}
          </button>
        )}
        {isEigenaar && (
          <button
            type="button"
            onClick={() => {
              setSoortenBeheerModus((m) => !m);
              setBewerkteSoort(null);
            }}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[15px] font-semibold text-[#0a6a32]"
          >
            {soortenBeheerModus ? t.klaar : `✎ ${t.soortenBeheren}`}
          </button>
        )}
        {bewerkteSoort !== null && (
          <div className="mt-2">
            <SoortBeheerPanel
              soort={bewerkteSoort === "nieuw" ? null : bewerkteSoort}
              taal={taal}
              onKlaar={sluitSoortenBeheer}
              onAnnuleren={sluitSoortenBeheer}
            />
          </div>
        )}
      </div>
    );
  }

  function AbonneerPopover() {
    return (
      <div className="w-[280px] rounded-2xl border border-[#dfe3dd] bg-white p-4 shadow-lg">
        <b className="text-[15px]">{t.abonneer}</b>
        <p className="mb-3 mt-1 text-sm text-[#4f5b53]">{t.abonneerTekst}</p>
        <div className="flex flex-col gap-2">
          <a
            href={googleAbonnerenUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-full bg-[#0b853f] px-4 text-sm font-semibold text-white no-underline"
          >
            {t.google}
          </a>
          <a
            href={agendaWebcalUrl()}
            className="flex h-11 items-center justify-center rounded-full bg-[#0b853f] px-4 text-sm font-semibold text-white no-underline"
          >
            {t.apple}
          </a>
          <KopieerLinkKnopLicht url={agendaIcsUrl()} label={t.kopieer} gekopieerdLabel={t.gekopieerd} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-[calc(100vh-4rem)] md:overflow-hidden">
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:flex md:h-full md:min-h-0">
        <aside className="flex w-[264px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-[#dfe3dd] bg-[#fbfaf7] p-4">
          {SidebarRows()}
          {upcoming.length > 0 && (
            <div>
              <div className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-[#4f5b53]">{t.komende}</div>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {upcoming.map((ev) => {
                  const sleutel = brusselsSleutel(ev.start);
                  const d = naarUtcMiddag(sleutel);
                  return (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => setDrawerEvent(ev)}
                        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left"
                      >
                        <span className="flex h-11 w-10 flex-none flex-col items-center justify-center rounded-xl bg-[#ece9df] leading-none">
                          <b className="text-[17px]">{d.getUTCDate()}</b>
                          <span className="mt-0.5 text-[10px] font-semibold uppercase text-[#4f5b53]">
                            {t.maandKort[d.getUTCMonth()]}
                          </span>
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <b className="text-sm">{vertaaldVeld(taal, ev.titel, ev.titelTr)}</b>
                          <span className="text-xs text-[#4f5b53]">
                            {hoofdletter(t.dagVol[d.getUTCDay()])} · {ev.heleDag ? t.heleDag.toLowerCase() : brusselsTijd(ev.start)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto bg-white">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[#dfe3dd] bg-white px-5 py-3">
            <button
              type="button"
              onClick={naarVandaag}
              className="h-11 rounded-full border-[1.5px] border-[#14231a] px-4 text-sm font-semibold"
            >
              {t.vandaag}
            </button>
            <button
              type="button"
              aria-label="Vorige"
              onClick={() => gaDesktop(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ChevronLinks />
            </button>
            <button
              type="button"
              aria-label="Volgende"
              onClick={() => gaDesktop(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ChevronRechts />
            </button>
            <h1 className="m-0 whitespace-nowrap text-[26px] font-bold">{titelDesktop}</h1>
            {weergaveDesktop === "week" && (
              <span className="rounded-full bg-[#e8f3ec] px-3 py-1 text-[13px] font-semibold text-[#0a6a32]">
                {t.week} {isoWeekNummer(anchor)}
              </span>
            )}
            <span className="flex-1" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setSubOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={subOpen}
                className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[#cfd5cd] px-4 text-sm font-semibold"
              >
                <LinkIcon /> {t.abonneerKort}
              </button>
              {subOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSubOpen(false)} />
                  <div className="absolute right-0 top-[52px] z-20">
                    {AbonneerPopover()}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className="flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-[#14231a] px-4 text-sm font-semibold"
              >
                {huidigeLabelDesktop} <ChevronOnder />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-[52px] z-20 w-[232px] rounded-2xl border border-[#dfe3dd] bg-white p-2 shadow-lg">
                    <div className="px-3.5 py-2 text-xs font-semibold uppercase text-[#4f5b53]">{t.weergave}</div>
                    {weergavesDesktop.map((w) => (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => setWeergaveDesktop(w.key)}
                        className="flex h-12 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-semibold"
                        style={weergaveDesktop === w.key ? { background: "#e8f3ec", color: "#0a6a32" } : undefined}
                      >
                        {w.label}
                        {weergaveDesktop === w.key && " ✓"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {weergaveDesktop === "maand" && renderMaandDesktop()}
          {weergaveDesktop === "jaar" && renderJaar()}
          {weergaveDesktop === "dag" && renderTimeline(1, anchor, 60, true)}
          {weergaveDesktop === "week" && renderTimeline(7, maandagVan(anchor), 60, true)}
        </section>
      </div>

      {/* ===================== MOBIEL ===================== */}
      <div className="flex flex-col gap-4 p-4 md:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-[24px] font-bold leading-tight">{titelMobiel}</h1>
            {subMobiel && <div className="text-sm text-[#4f5b53]">{subMobiel}</div>}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Vorige" onClick={() => gaMobiel(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd5cd] bg-white">
              <ChevronLinks />
            </button>
            <button type="button" aria-label="Volgende" onClick={() => gaMobiel(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd5cd] bg-white">
              <ChevronRechts />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-[#14231a] bg-white px-4 text-sm font-semibold"
            >
              {huidigeLabelMobiel} <ChevronOnder />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-[52px] z-20 w-[232px] rounded-2xl border border-[#dfe3dd] bg-white p-2 shadow-lg">
                  <div className="px-3.5 py-2 text-xs font-semibold uppercase text-[#4f5b53]">{t.weergave}</div>
                  {weergavesMobiel.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setWeergaveMobiel(w.key)}
                      className="flex h-12 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-semibold"
                      style={weergaveMobiel === w.key ? { background: "#e8f3ec", color: "#0a6a32" } : undefined}
                    >
                      {w.label}
                      {weergaveMobiel === w.key && " ✓"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={naarVandaag} className="h-11 rounded-full border-[1.5px] border-[#cfd5cd] bg-white px-4 text-sm font-semibold">
            {t.vandaag}
          </button>
        </div>

        <div
          role="group"
          aria-label="Filter op soort activiteit"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {chips.map((chip) => {
            const actief = filter === chip.key;
            if (soortenBeheerModus && chip.soort) {
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setBewerkteSoort(chip.soort)}
                  className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[#cfd5cd] bg-white px-[18px] text-sm font-semibold"
                >
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: chip.kleur }} />
                  {chip.label} ✎
                </button>
              );
            }
            if (soortenBeheerModus && chip.key === "alle") return null;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={actief}
                onClick={() => setFilter(chip.key)}
                className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-[18px] text-sm font-semibold"
                style={{
                  borderColor: actief ? "#14231a" : "#cfd5cd",
                  background: actief ? "#14231a" : "#ffffff",
                  color: actief ? "#ffffff" : "#14231a",
                }}
              >
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: chip.kleur }} />
                {chip.label}
              </button>
            );
          })}
          {soortenBeheerModus && (
            <button
              type="button"
              onClick={() => setBewerkteSoort("nieuw")}
              className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-dashed border-[#14231a] bg-white px-[18px] text-sm font-semibold"
            >
              ＋ {t.nieuweSoort}
            </button>
          )}
          {isEigenaar && (
            <button
              type="button"
              onClick={() => {
                setSoortenBeheerModus((m) => !m);
                setBewerkteSoort(null);
              }}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-[#14231a] bg-white px-[18px] text-sm font-semibold"
            >
              {soortenBeheerModus ? t.klaar : `✎ ${t.soortenBeheren}`}
            </button>
          )}
        </div>

        {bewerkteSoort !== null && (
          <SoortBeheerPanel
            soort={bewerkteSoort === "nieuw" ? null : bewerkteSoort}
            taal={taal}
            onKlaar={sluitSoortenBeheer}
            onAnnuleren={sluitSoortenBeheer}
          />
        )}

        {weergaveMobiel === "lijst" && renderLijst()}
        {weergaveMobiel === "maand" && renderMaandMobiel()}
        {weergaveMobiel === "dag1" && renderTimelineMobielMetLink(1, anchor)}
        {weergaveMobiel === "dag2" && renderTimelineMobielMetLink(2, anchor)}
        {weergaveMobiel === "dag3" && renderTimelineMobielMetLink(3, anchor)}

        <AbonneerBlok t={t} />
      </div>

      {/* ===================== DETAILLADE (enkel desktop) ===================== */}
      <div
        className={`fixed bottom-0 right-0 top-16 z-30 hidden w-[360px] flex-col gap-4 border-l border-[#dfe3dd] bg-white p-6 shadow-2xl transition-transform duration-200 md:flex ${
          drawerEvent ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-hidden={!drawerEvent}
      >
        {drawerEvent && (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#4f5b53]">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: drawerEvent.soort.kleur }} />
                {soortNaam(drawerEvent.soort, taal)}
              </span>
              <button
                type="button"
                onClick={() => setDrawerEvent(null)}
                aria-label="Sluiten"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0efe9]"
              >
                ✕
              </button>
            </div>
            <h2 className="m-0 text-[28px] leading-[1.15] font-bold">{vertaaldVeld(taal, drawerEvent.titel, drawerEvent.titelTr)}</h2>
            <div className="flex flex-col gap-2 text-[15px]">
              <span>📅 {hoofdletter(t.dagVol[drawerEvent.start.getUTCDay()])} {dagLabel(brusselsSleutel(drawerEvent.start)).split(" · ").pop()} {naarUtcMiddag(brusselsSleutel(drawerEvent.start)).getUTCFullYear()}</span>
              <span>
                🕒 {drawerEvent.heleDag ? t.heleDag : `${brusselsTijd(drawerEvent.start)} – ${brusselsTijd(drawerEvent.einde)} ${t.uur}`}
              </span>
              {drawerEvent.locatie && <span>📍 {vertaaldVeld(taal, drawerEvent.locatie, drawerEvent.locatieTr)}</span>}
            </div>
            <Link
              href={`/activiteit/${drawerEvent.id}`}
              className="mt-1 flex h-12 items-center justify-center rounded-full bg-[#0b853f] text-[15px] font-semibold text-white no-underline"
            >
              {t.toevoegen}
            </Link>
          </>
        )}
      </div>
      {drawerEvent && <div className="fixed inset-0 top-16 z-20 hidden bg-black/10 md:block" onClick={() => setDrawerEvent(null)} />}
    </div>
  );
}

function EventTint({ ev, taal, onKies }: { ev: ActiviteitKort; taal: Taal; onKies: () => void }) {
  return (
    <button
      type="button"
      onClick={onKies}
      className="block w-full overflow-hidden rounded-r-lg rounded-l-sm py-1 pl-2 pr-1.5 text-left text-xs leading-tight text-[#14231a]"
      style={tintStijl(ev.soort.kleur)}
    >
      <b>{brusselsTijd(ev.start)}</b> {vertaaldVeld(taal, ev.titel, ev.titelTr)}
    </button>
  );
}

function EventRij({ ev, t, taal }: { ev: ActiviteitKort; t: WoordenBoek; taal: Taal }) {
  return (
    <Link
      href={`/activiteit/${ev.id}`}
      className="flex min-h-[88px] items-center gap-3.5 rounded-2xl border border-[#dfe3dd] bg-white px-3.5 py-3.5 text-[#14231a] no-underline"
    >
      <span className="w-14 flex-none text-[15px] font-bold leading-tight">
        {ev.heleDag ? (
          t.heleDag
        ) : (
          <>
            {brusselsTijd(ev.start)}
            <span className="mt-0.5 block text-xs font-medium text-[#4f5b53]">{t.uur}</span>
          </>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4f5b53]">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: ev.soort.kleur }} />
          {soortNaam(ev.soort, taal)}
        </span>
        <span className="text-[17px] font-semibold leading-tight">{vertaaldVeld(taal, ev.titel, ev.titelTr)}</span>
        {ev.locatie && <span className="text-sm text-[#4f5b53]">{vertaaldVeld(taal, ev.locatie, ev.locatieTr)}</span>}
      </span>
      <ChevronRechts kleur="#4f5b53" />
    </Link>
  );
}

function AbonneerBlok({ t }: { t: WoordenBoek }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-[#14231a] p-6 text-white">
      <h2 className="m-0 text-lg font-bold">{t.abonneer}</h2>
      <p className="m-0 text-sm leading-relaxed text-[#d5ddd7]">{t.abonneerTekst}</p>
      <div className="flex flex-col gap-2">
        <a
          href={googleAbonnerenUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-between rounded-full bg-white px-[18px] text-[15px] font-semibold text-[#14231a] no-underline"
        >
          {t.google}
          <ChevronRechts />
        </a>
        <a
          href={agendaWebcalUrl()}
          className="flex h-12 items-center justify-between rounded-full bg-white px-[18px] text-[15px] font-semibold text-[#14231a] no-underline"
        >
          {t.apple}
          <ChevronRechts />
        </a>
        <KopieerLinkKnop url={agendaIcsUrl()} label={t.kopieer} gekopieerdLabel={t.gekopieerd} />
      </div>
    </div>
  );
}

function KopieerLinkKnopLicht({ url, label, gekopieerdLabel }: { url: string; label: string; gekopieerdLabel: string }) {
  return (
    <div className="[&_button]:!border-[#14231a] [&_button]:!text-[#14231a] [&_span:last-child]:!text-[#4f5b53]">
      <KopieerLinkKnop url={url} label={label} gekopieerdLabel={gekopieerdLabel} />
    </div>
  );
}

function ChevronLinks() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function ChevronRechts({ kleur }: { kleur?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={kleur ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function ChevronOnder() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1.2-1.2" />
    </svg>
  );
}
