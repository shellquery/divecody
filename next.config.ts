import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable image optimization for simpler deployment
  images: { unoptimized: true },
  // Allow reading from data/ dir at build time
  experimental: {},
};

export default nextConfig;
