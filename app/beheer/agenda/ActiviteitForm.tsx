"use client";

import { useActionState, useState } from "react";
import type { Soort } from "@/lib/soort-types";

type ActieFn = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

export type ActiviteitFormWaarden = {
  titel: string;
  titelTr: string;
  soortId: number;
  zichtbaarheid: string;
  locatie: string;
  locatieTr: string;
  beschrijving: string;
  beschrijvingTr: string;
  heleDag: boolean;
  startInput: string;
  eindeInput: string;
  startDatumInput: string;
  eindeDatumInput: string;
};

export const LEGE_WAARDEN: Omit<ActiviteitFormWaarden, "soortId"> = {
  titel: "",
  titelTr: "",
  zichtbaarheid: "publiek",
  locatie: "",
  locatieTr: "",
  beschrijving: "",
  beschrijvingTr: "",
  heleDag: false,
  startInput: "",
  eindeInput: "",
  startDatumInput: "",
  eindeDatumInput: "",
};

export default function ActiviteitForm({
  actie,
  initieel,
  soorten,
  toonHerhaalOptie,
  reeksKeuze,
}: {
  actie: ActieFn;
  initieel: ActiviteitFormWaarden;
  soorten: Soort[];
  toonHerhaalOptie?: boolean;
  reeksKeuze?: { reeksAantal: number };
}) {
  const [fout, formAction, bezig] = useActionState(actie, undefined);
  const [heleDag, setHeleDag] = useState(initieel.heleDag);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {fout && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{fout}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="titel" className="text-sm font-semibold text-[#14231a]">
            Titel
          </label>
          <input
            id="titel"
            name="titel"
            type="text"
            required
            defaultValue={initieel.titel}
            className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="titelTr" className="text-sm font-semibold text-[#14231a]">
            Titel (Turks, optioneel)
          </label>
          <input
            id="titelTr"
            name="titelTr"
            type="text"
            defaultValue={initieel.titelTr}
            className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="soortId" className="text-sm font-semibold text-[#14231a]">
          Soort
        </label>
        <select
          id="soortId"
          name="soortId"
          defaultValue={initieel.soortId}
          className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
        >
          {soorten.map((s) => (
            <option key={s.id} value={s.id}>
              {s.naamNl}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-[#14231a]">
        <input
          type="checkbox"
          name="heleDag"
          checked={heleDag}
          onChange={(e) => setHeleDag(e.target.checked)}
          className="h-4 w-4"
        />
        Hele dag (of meerdere dagen)
      </label>

      {heleDag ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDatum" className="text-sm font-semibold text-[#14231a]">
              Startdatum
            </label>
            <input
              id="startDatum"
              name="startDatum"
              type="date"
              required
              defaultValue={initieel.startDatumInput}
              className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="eindeDatum" className="text-sm font-semibold text-[#14231a]">
              Einddatum
            </label>
            <input
              id="eindeDatum"
              name="eindeDatum"
              type="date"
              required
              defaultValue={initieel.eindeDatumInput}
              className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="start" className="text-sm font-semibold text-[#14231a]">
              Start
            </label>
            <input
              id="start"
              name="start"
              type="datetime-local"
              required
              defaultValue={initieel.startInput}
              className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="einde" className="text-sm font-semibold text-[#14231a]">
              Einde
            </label>
            <input
              id="einde"
              name="einde"
              type="datetime-local"
              required
              defaultValue={initieel.eindeInput}
              className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="locatie" className="text-sm font-semibold text-[#14231a]">
            Locatie (optioneel)
          </label>
          <input
            id="locatie"
            name="locatie"
            type="text"
            defaultValue={initieel.locatie}
            className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="locatieTr" className="text-sm font-semibold text-[#14231a]">
            Locatie (Turks, optioneel)
          </label>
          <input
            id="locatieTr"
            name="locatieTr"
            type="text"
            defaultValue={initieel.locatieTr}
            className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="beschrijving" className="text-sm font-semibold text-[#14231a]">
            Beschrijving (optioneel)
          </label>
          <textarea
            id="beschrijving"
            name="beschrijving"
            rows={4}
            defaultValue={initieel.beschrijving}
            className="rounded-xl border border-[#dfe3dd] px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="beschrijvingTr" className="text-sm font-semibold text-[#14231a]">
            Beschrijving (Turks, optioneel)
          </label>
          <textarea
            id="beschrijvingTr"
            name="beschrijvingTr"
            rows={4}
            defaultValue={initieel.beschrijvingTr}
            className="rounded-xl border border-[#dfe3dd] px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="zichtbaarheid" className="text-sm font-semibold text-[#14231a]">
          Zichtbaarheid
        </label>
        <select
          id="zichtbaarheid"
          name="zichtbaarheid"
          defaultValue={initieel.zichtbaarheid}
          className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
        >
          <option value="publiek">Publiek (iedereen)</option>
          <option value="leiding">Enkel leiding</option>
        </select>
      </div>

      {toonHerhaalOptie && !heleDag && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="herhaalTot" className="text-sm font-semibold text-[#14231a]">
            Herhaal wekelijks tot (optioneel)
          </label>
          <input
            id="herhaalTot"
            name="herhaalTot"
            type="date"
            className="h-11 rounded-xl border border-[#dfe3dd] px-3.5 text-[15px] outline-none focus:border-[#0b853f]"
          />
          <p className="text-xs text-[#4f5b53]">
            Maakt losse activiteiten aan op dezelfde weekdag en tijd, elke week tot en met deze datum.
          </p>
        </div>
      )}

      {reeksKeuze && (
        <fieldset className="flex flex-col gap-2 rounded-xl border border-[#dfe3dd] p-4">
          <legend className="px-1 text-sm font-semibold text-[#14231a]">
            Deze activiteit maakt deel uit van een reeks ({reeksKeuze.reeksAantal} activiteiten)
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="scope" value="deze" defaultChecked />
            Toepassen op enkel deze activiteit
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="scope" value="reeks" />
            Toepassen op de hele reeks ({reeksKeuze.reeksAantal} activiteiten)
          </label>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={bezig}
        className="h-12 self-start rounded-full bg-[#0b853f] px-6 text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {bezig ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
