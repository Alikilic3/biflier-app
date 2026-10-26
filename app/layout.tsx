import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import Header from "./components/Header";
import LanguageProvider from "./components/LanguageProvider";
import { huidigeTaal } from "@/lib/taal";
import { getBeheerder } from "@/lib/dal";
import { onderhoudActief } from "@/lib/onderhoud";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BifLier",
  description: "Agenda van BIF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BifLier",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b853f",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const taal = await huidigeTaal();
  const onderhoud = onderhoudActief();
  // Tijdens onderhoud is de enige pagina die een uitgelogde bezoeker ooit
  // bereikt /onderhoud of /login (de proxy stuurt alles anders daarheen) —
  // die tonen dus bewust geen site-chrome. Een ingelogde beheerder ziet de
  // site gewoon, met de gele balk hieronder als enige aanpassing.
  const beheerder = onderhoud ? await getBeheerder() : null;
  const toonChrome = !onderhoud || beheerder != null;

  return (
    <html lang={taal} className={`${figtree.variable} h-full antialiased`}>
      <body className="h-full">
        <LanguageProvider initieelTaal={taal}>
          {onderhoud && beheerder != null && (
            <div className="flex min-h-11 items-center justify-center bg-[#f5b700] px-4 text-center text-sm font-semibold text-[#14231a]">
              Onderhoudsmodus staat aan: bezoekers zien een onderhoudspagina.
            </div>
          )}
          {toonChrome && <Header />}
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
