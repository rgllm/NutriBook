import { defineConfig, devices } from "@playwright/test"

import { API_URL, FRONTEND_URL } from "./support/stack"

// Run through `pnpm e2e`, which resets the Docker stack before Playwright
// starts. Specs share one database, so they run one at a time, and a failure
// is never retried away.
export default defineConfig({
  testDir: "specs",
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
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm --dir ../frontend build && pnpm --dir ../frontend start --port ${new URL(FRONTEND_URL).port}`,
    url: FRONTEND_URL,
    env: { API_URL },
    reuseExistingServer: false,
    timeout: 240_000,
  },
})
