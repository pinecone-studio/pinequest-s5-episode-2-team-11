import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Утаснаас турших үед компьютерийнхээ IP-г энд нэмнэ (ipconfig → IPv4 Address)
  // *.app.github.dev — GitHub Codespaces-ийн forwarded port
  allowedDevOrigins: ["172.20.10.2", "192.168.50.244", "*.app.github.dev"],
  // Web Push service worker: always fetch the latest version.
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    }];
  },
};

export default nextConfig;
