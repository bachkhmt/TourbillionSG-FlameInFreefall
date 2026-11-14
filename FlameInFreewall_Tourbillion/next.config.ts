import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';
    return [
      { source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` },
      { source: '/studio', destination: `${backend}/studio` },
      { source: '/assets/:path*', destination: `${backend}/assets/:path*` },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
