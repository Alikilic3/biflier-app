"use client";

import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import { useTaal } from "@/app/components/LanguageProvider";

export default function HeaderNav({
  ingelogd,
  isAdmin,
}: {
  ingelogd: boolean;
  isAdmin: boolean;
}) {
  const { taal, setTaal, t } = useTaal();

  return (
    <nav aria-label="Hoofdmenu" className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Taal / Dil"
        className="inline-flex rounded-full border-[1.5px] border-[#cfd5cd] bg-white p-0.5"
      >
        <button
          type="button"
          onClick={() => setTaal("nl")}
          aria-pressed={taal === "nl"}
          className="h-9 min-w-[40px] rounded-full px-2 text-sm font-bold"
          style={taal === "nl" ? { background: "#14231a", color: "#ffffff" } : undefined}
        >
          NL
        </button>
        <button
          type="button"
          onClick={() => setTaal("tr")}
          aria-pressed={taal === "tr"}
          className="h-9 min-w-[40px] rounded-full px-2 text-sm font-bold"
          style={taal === "tr" ? { background: "#14231a", color: "#ffffff" } : undefined}
        >
          TR
        </button>
      </div>

      {ingelogd ? (
        <>
          {isAdmin && (
            <Link
              href="/beheer/agenda"
              className="hidden h-11 items-center rounded-full px-4 text-sm font-semibold text-[#14231a] transition-colors hover:bg-[#f0efe9] sm:inline-flex"
            >
              {t.beheer}
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full border border-[#14231a] px-5 text-sm font-semibold text-[#14231a] transition-colors hover:bg-[#f0efe9]"
            >
              {t.uitloggen}
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-full bg-[#14231a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a3b31]"
        >
          {t.inloggen}
        </Link>
      )}
    </nav>
  );
}
