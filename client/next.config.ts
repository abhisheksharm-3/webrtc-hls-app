import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:3002/health',
      },
      {
        source: '/hls/:path*',
        destination: 'http://localhost:3002/hls/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3002/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
