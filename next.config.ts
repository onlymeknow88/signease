import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // canvas is not available in browser environments
    resolveAlias: {
      canvas: "./src/lib/empty-module.ts",
    },
  },
};

export default nextConfig;
