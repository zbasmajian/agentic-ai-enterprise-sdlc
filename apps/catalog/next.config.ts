import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Bundle a minimal server.js plus only the files it needs into .next/standalone,
  // so the Docker image stays small (see Dockerfile).
  output: "standalone",
  // Emit browser source maps only for the coverage build (COVERAGE=1), so the
  // V8 coverage Playwright collects maps back to the original TypeScript in
  // src/. Normal production builds stay lean and ship no source maps.
  productionBrowserSourceMaps: process.env.COVERAGE === "1",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
