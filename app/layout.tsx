import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import Header from "./components/Header";
import LanguageProvider from "./components/LanguageProvider";
import { huidigeTaal } from "@/lib/taal";
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

  return (
    <html lang={taal} className={`${figtree.variable} h-full antialiased`}>
      <body className="h-full">
        <LanguageProvider initieelTaal={taal}>
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
