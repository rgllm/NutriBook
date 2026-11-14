import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    env: { API_URL: "http://api.test" },
  },
})
