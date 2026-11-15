import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Run outside Portugal so code that leans on the machine's zone fails here.
    env: { API_URL: "http://api.test", TZ: "America/Los_Angeles" },
    unstubGlobals: true,
  },
})
