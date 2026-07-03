import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['project2-zphf.onrender.com', 'api.heyitsshubh.me', 'bhattanisha.me'], // Allow images from these domains
  },
};

export default nextConfig;