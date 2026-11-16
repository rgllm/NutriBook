import { afterEach, describe, expect, it, vi } from "vitest"

import { ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import { fetchLocations, fetchNearestCity } from "@/lib/api/locations"

vi.mock("server-only", () => ({}))

const payload = { locations: ["Braga", "Lisboa", "Porto"], default: "Braga" }

function respondWith(response: Response) {
  const fetch = vi.fn<(url: URL) => Promise<Response>>(async () => response)
  vi.stubGlobal("fetch", fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetchLocations", () => {
  it("loads the locations from the API", async () => {
    const fetch = respondWith(Response.json(payload))

    await expect(fetchLocations()).resolves.toEqual(payload)
    expect(String(fetch.mock.calls[0][0])).toBe("http://api.test/locations")
  })

  it.each([
    ["without a default", { locations: payload.locations }],
    ["with a location that is not a string", { ...payload, locations: ["Braga", 4] }],
    ["with locations that are not a list", { ...payload, locations: "Braga" }],
  ])("treats a payload %s as a bug, not an outage", async (_, body) => {
    respondWith(Response.json(body))

    const error = await fetchLocations().catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })
})

describe("fetchNearestCity", () => {
  it("asks the API for the city nearest the point", async () => {
    const fetch = respondWith(Response.json({ city: "Porto" }))

    await expect(fetchNearestCity(41.12, -8.61)).resolves.toBe("Porto")
    expect(String(fetch.mock.calls[0][0])).toBe(
      "http://api.test/locations/nearest?latitude=41.12&longitude=-8.61",
    )
  })

  it("reports a directory with no cities as not found", async () => {
    respondWith(Response.json({ error: "City not found" }, { status: 404 }))

    await expect(fetchNearestCity(41.12, -8.61)).rejects.toBeInstanceOf(ApiNotFoundError)
  })

  it("treats a payload without a city as a bug, not an outage", async () => {
    respondWith(Response.json({ name: "Porto" }))

    const error = await fetchNearestCity(41.12, -8.61).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })
})
