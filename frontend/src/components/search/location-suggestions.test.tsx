import { screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LocationSuggestions } from "@/components/search/location-suggestions"
import { render } from "@/test/render"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("LocationSuggestions", () => {
  it("suggests the known cities and names the default", async () => {
    stubApi(Response.json({ locations: ["Braga", "Porto"], default: "Braga" }))

    const { container } = render(<>{await LocationSuggestions()}</>)

    const options = container.querySelectorAll("datalist#known-cities option")
    expect(Array.from(options, (option) => option.getAttribute("value"))).toEqual(["Braga", "Porto"])
    expect(screen.getByText(/Braga/)).toHaveAttribute("id", "search-location-hint")
  })

  it("renders nothing while the API is unavailable", async () => {
    stubApi(new TypeError("fetch failed"))

    expect(await LocationSuggestions()).toBeUndefined()
  })
})
