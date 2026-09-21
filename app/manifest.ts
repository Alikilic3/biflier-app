import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BifLier",
    short_name: "BifLier",
    description: "Aanwezigheidsregistratie voor lezingen",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0b853f",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
