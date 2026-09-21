import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BifLier",
  description: "Aanwezigheidsregistratie voor lezingen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BifLier",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b853f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Header />
        {children}
      </body>
    </html>
  );
}
