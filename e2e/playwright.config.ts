import { defineConfig, devices } from "@playwright/test"

import { API_URL, FRONTEND_PORT, FRONTEND_URL, MAILPIT_URL } from "./support/stack"

const demo = process.env.E2E_DEMO === "1"

// Every run starts from a reset Docker stack (global-setup.ts). Specs share one
// database, so they run one at a time, and a failure is never retried away.
export default defineConfig({
  testDir: "specs",
  ...(demo ? { testMatch: "demo.spec.ts" } : { testIgnore: "demo.spec.ts" }),
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
    command: demo
      ? `pnpm --dir ../frontend dev --hostname 127.0.0.1 --port ${FRONTEND_PORT}`
      : `pnpm --dir ../frontend build && pnpm --dir ../frontend start --port ${FRONTEND_PORT}`,
    url: FRONTEND_URL,
    env: { API_URL, MAILPIT_URL, NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: false,
    timeout: 240_000,
  },
})
