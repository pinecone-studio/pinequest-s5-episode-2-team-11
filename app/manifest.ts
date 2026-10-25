import type { MetadataRoute } from "next";

// Утсан дээр «Add to Home Screen» хийхэд апп шиг суулгагдана (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bloomy",
    short_name: "Bloomy",
    description: "Өсвөр насны охид болон асран хамгаалагчдад зориулсан мөчлөг, халамжийн апп",
    lang: "mn",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF7FB",
    theme_color: "#F48FB1",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
