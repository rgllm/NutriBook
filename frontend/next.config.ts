import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The project's own AGENTS.md lives at the repository root.
  agentRules: false,
  reactCompiler: true,
  // 301, not the 308 that `permanent: true` sends, as old links are only ever GETs.
  async redirects() {
    return [
      { source: "/nutritionists/:path*", destination: "/professionals/:path*", statusCode: 301 },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
