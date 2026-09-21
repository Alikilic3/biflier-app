import Image from "next/image";
import Link from "next/link";
import { getBeheerder } from "@/lib/dal";
import { logout } from "@/lib/auth-actions";

export default async function Header() {
  const beheerder = await getBeheerder();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="BIF"
            width={188}
            height={57}
            priority
            className="h-8 w-auto sm:h-9"
          />
          <span className="hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />
          <span className="hidden text-sm font-medium text-neutral-500 sm:block">
            BifLier
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {beheerder ? (
            <>
              {beheerder.rol === "admin" && (
                <>
                  <Link
                    href="/lezingen/nieuw"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    <span aria-hidden className="text-base leading-none">
                      +
                    </span>
                    Nieuwe lezing
                  </Link>
                  <Link
                    href="/leerlingen"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Leerlingen
                  </Link>
                </>
              )}
              <span className="hidden text-neutral-400 sm:inline">·</span>
              <span className="hidden text-neutral-500 sm:inline">
                Ingelogd als{" "}
                <span className="font-medium text-neutral-700">
                  {beheerder.name}
                </span>
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-neutral-600 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
                >
                  Uitloggen
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              Inloggen
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
