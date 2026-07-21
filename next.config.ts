import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "assets.tcgdex.net" },
    ],
  },
};

export default nextConfig;
