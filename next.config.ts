import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker deployment - produces standalone output
  output: "standalone",
};

export default nextConfig;
