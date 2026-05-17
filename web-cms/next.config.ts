import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8081/api/v1/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
