import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

describe("API URL configuration", () => {
  it.each([
    [undefined, "http://localhost:3001/locations"],
    ["http://127.0.0.1:3101", "http://127.0.0.1:3101/locations"],
  ])("loads locations with API_URL set to %s", async (apiUrl, expectedUrl) => {
    vi.stubEnv("API_URL", apiUrl)
    const payload = { locations: ["Braga"], default: "Braga" }
    const fetch = stubApi(Response.json(payload))
    const { fetchLocations } = await import("@/lib/api/locations")

    await expect(fetchLocations()).resolves.toEqual(payload)
    expect(String(fetch.mock.calls[0][0])).toBe(expectedUrl)
  })

  it.each(["", "invalid-url"])("rejects an invalid API_URL of %s", async (apiUrl) => {
    vi.stubEnv("API_URL", apiUrl)

    await expect(import("@/lib/api/http")).rejects.toThrow("API_URL must be a valid URL.")
  })
})
