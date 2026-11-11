import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    authInterrupts: true,
  },
  outputFileTracingIncludes: {
    "/ceo/**": ["src/lib/pdf/fonts/**/*", "public/brand/lockup-light.png"],
  },
};

export default nextConfig;
