import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/studio',
        destination: '/studio.html',
      },
    ];
  },
};

export default nextConfig;
