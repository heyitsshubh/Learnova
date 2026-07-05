import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['bhattanisha.me'], // Allow images from these domains
  },
};

export default nextConfig;