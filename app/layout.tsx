import type { Metadata, Viewport } from "next";
import "./globals.css";
import Application from "./components/Application";

export const metadata: Metadata = {
  title: "Bloomy",
  description: "Өсвөр насны охид болон асран хамгаалагчдад зориулсан мөчлөг, халамжийн апп",
  applicationName: "Bloomy",
  appleWebApp: { capable: true, title: "Bloom", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF7FB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>
        {/* Апп нэг л удаа ачаалагдаж, хуудас хооронд шилжихэд өгөгдлөө хадгална */}
        <Application />
        {children}
      </body>
    </html>
  );
}
