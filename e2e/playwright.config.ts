import { defineConfig, devices } from "@playwright/test"

import { API_URL, FRONTEND_PORT, FRONTEND_URL } from "./support/stack"

// Every run starts from a reset Docker stack (global-setup.ts). Specs share one
// database, so they run one at a time, and a failure is never retried away.
export default defineConfig({
  testDir: "specs",
  globalSetup: "./global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    // Outside Portugal, so a time shown in the browser's zone instead of
    // Lisbon's fails the suite.
    timezoneId: "America/Los_Angeles",
    // The browser asks for British English, the app's default language.
    locale: "en-GB",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm --dir ../frontend build && pnpm --dir ../frontend start --port ${FRONTEND_PORT}`,
    url: FRONTEND_URL,
    env: { API_URL, NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: false,
    timeout: 240_000,
  },
})
