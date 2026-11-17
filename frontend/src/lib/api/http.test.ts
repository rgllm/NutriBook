import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

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

// Every API call goes through apiGet or apiWrite, so how a failure is
// classified is tested once here: an outage pages show a retry message for,
// a missing record, or a bug for the nearest error.tsx.
describe("failure classification", () => {
  const get = async () => {
    const { apiGet } = await import("@/lib/api/http")
    return apiGet("/locations", z.object({ locations: z.array(z.string()), default: z.string() }))
  }
  const classify = async (response: Response | Error, options?: { checkContract: boolean }) => {
    stubApi(response, options)
    const { ApiNotFoundError, ApiUnavailableError } = await import("@/lib/api/http")
    const error = await get().catch((error: unknown) => error)
    if (error instanceof ApiUnavailableError) return "unavailable"
    if (error instanceof ApiNotFoundError) return "not found"
    return "bug"
  }

  it("treats an unreachable or failing API as unavailable", async () => {
    expect(await classify(new TypeError("fetch failed"))).toBe("unavailable")
    expect(await classify(new Response(null, { status: 503 }))).toBe("unavailable")
  })

  it("treats a body that fails after the headers as unavailable", async () => {
    const stalledBody = new ReadableStream({
      start(controller) {
        controller.error(new DOMException("The operation timed out.", "TimeoutError"))
      },
    })
    expect(await classify(new Response(stalledBody))).toBe("unavailable")
  })

  it("reports a 404 as not found", async () => {
    expect(await classify(new Response(null, { status: 404 }), { checkContract: false })).toBe("not found")
  })

  it("treats other client errors and malformed replies as bugs, not outages", async () => {
    expect(await classify(new Response(null, { status: 400 }), { checkContract: false })).toBe("bug")
    expect(
      await classify(new Response("{", { headers: { "Content-Type": "application/json" } }), { checkContract: false }),
    ).toBe("bug")
    expect(await classify(Response.json({ locations: "Braga" }), { checkContract: false })).toBe("bug")
  })
})
