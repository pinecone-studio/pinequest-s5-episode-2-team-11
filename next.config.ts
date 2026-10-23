import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Утаснаас турших үед компьютерийнхээ IP-г энд нэмнэ (ipconfig → IPv4 Address)
  // *.app.github.dev — GitHub Codespaces-ийн forwarded port
  allowedDevOrigins: ["172.20.10.2", "192.168.50.244", "*.app.github.dev"],
};

export default nextConfig;
