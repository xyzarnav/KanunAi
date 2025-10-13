import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: require('path').join(__dirname, '..'),
  async rewrites() {
    return [
      {
        source: "/api/analysis/:path*",
        destination: "http://localhost:5000/api/analysis/:path*",
      },
    ];
  },
};

export default nextConfig;
