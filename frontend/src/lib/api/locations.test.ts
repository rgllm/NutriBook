import { describe, expect, it, vi } from "vitest"

import { fetchLocations } from "@/lib/api/locations"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))

const payload = { locations: ["Braga", "Lisboa", "Porto"], default: "Braga" }

describe("fetchLocations", () => {
  it("loads the locations from the API", async () => {
    const fetch = stubApi(Response.json(payload))

    await expect(fetchLocations()).resolves.toEqual(payload)
    expect(String(fetch.mock.calls[0][0])).toBe("http://api.test/locations")
  })
})
