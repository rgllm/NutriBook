import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { searchNearby } from "@/app/actions"
import { NearbyResults } from "@/components/search/nearby-results"
import { NearbySearchProvider } from "@/components/search/nearby-search"
import { SearchForm } from "@/components/search/search-form"
import type { SearchResults } from "@/lib/api/nutritionists"
import { nutritionist } from "@/test/nutritionist"
import { render } from "@/test/render"

vi.mock("server-only", () => ({}))
vi.mock("next/form", () => ({ default: (props: React.ComponentProps<"form">) => <form {...props} /> }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }))
vi.mock("@/app/actions", () => ({ searchNearby: vi.fn() }))

const found = (page: number): { status: "found"; results: SearchResults } => ({
  status: "found",
  results: {
    nutritionists: [{ ...nutritionist, addresses: [{ ...nutritionist.addresses[0], distanceKm: 0.8 }] }],
    location: { source: "nearby", city: null },
    pagination: { page, totalCount: 6, totalPages: 2 },
  },
})

function renderSearch() {
  return render(
    <NearbySearchProvider>
      <SearchForm query="diabetes" location="Porto" />
      <NearbyResults>
        <p>City results</p>
      </NearbyResults>
    </NearbySearchProvider>,
  )
}

beforeEach(() => {
  vi.mocked(searchNearby).mockImplementation(async (search) => found(search.page))
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (resolve: PositionCallback) =>
        resolve({ coords: { latitude: 41.55123, longitude: -8.42777 } } as GeolocationPosition),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("nearby search", () => {
  it("searches every city from the guest's rounded position for the typed query", async () => {
    renderSearch()

    await userEvent.click(screen.getByRole("button", { name: "Use my location" }))

    expect(searchNearby).toHaveBeenCalledWith(
      { query: "diabetes", location: "", page: 1 },
      { latitude: 41.551, longitude: -8.428 },
    )
    expect(screen.getByRole("textbox", { name: "Location" })).toHaveValue("")
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("6 nutritionists near you")
    expect(screen.getByText("0.8 km away")).toBeInTheDocument()
    expect(screen.queryByText("City results")).not.toBeInTheDocument()
  })

  it("keeps searching from the position for a new query, a typed city, or another page", async () => {
    renderSearch()
    await userEvent.click(screen.getByRole("button", { name: "Use my location" }))
    await screen.findByText("6 nutritionists near you")

    await userEvent.clear(screen.getByLabelText("Nutritionist or service"))
    await userEvent.type(screen.getByLabelText("Nutritionist or service"), "sports")
    await userEvent.type(screen.getByRole("textbox", { name: "Location" }), "Braga")
    await userEvent.click(screen.getByRole("button", { name: "Search" }))
    await userEvent.click(screen.getByRole("link", { name: "Go to next page" }))

    const position = { latitude: 41.551, longitude: -8.428 }
    expect(searchNearby).toHaveBeenNthCalledWith(2, { query: "sports", location: "Braga", page: 1 }, position)
    expect(searchNearby).toHaveBeenNthCalledWith(3, { query: "sports", location: "Braga", page: 2 }, position)
  })

  it("goes back to the city results when the guest stops using their location", async () => {
    renderSearch()
    await userEvent.click(screen.getByRole("button", { name: "Use my location" }))

    await userEvent.click(await screen.findByRole("button", { name: "Stop using my location" }))

    expect(screen.getByText("City results")).toBeInTheDocument()
  })
})
