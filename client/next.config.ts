import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    turbo: {
      rules: {},
    },
  },
};

export default nextConfig;
