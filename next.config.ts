import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['project2-zphf.onrender.com'], // Allow images from this domain
  },
};

export default nextConfig;