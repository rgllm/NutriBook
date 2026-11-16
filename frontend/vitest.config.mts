import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Run outside Portugal so code that leans on the machine's zone fails here.
    env: { API_URL: "http://api.test", TZ: "America/Los_Angeles" },
    unstubGlobals: true,
    projects: [
      { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"], environment: "node" } },
      {
        extends: true,
        test: {
          name: "components",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["src/test/setup-dom.ts"],
        },
      },
    ],
  },
})
