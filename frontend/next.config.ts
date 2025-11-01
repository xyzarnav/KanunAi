import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: require('path').join(__dirname, '..'),
  webpack: (config, { isServer }) => {
    // Optimize chunk loading for Mermaid
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          mermaid: {
            test: /[\\/]node_modules[\\/]mermaid[\\/]/,
            name: 'mermaid',
            priority: 10,
            enforce: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },
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
