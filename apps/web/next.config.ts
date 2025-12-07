import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@trading/shared'],
  experimental: {
    // Enable server actions for form handling
  },
};

export default nextConfig;
