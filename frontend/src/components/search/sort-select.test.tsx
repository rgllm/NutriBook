import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SortSelect } from "@/components/search/sort-select"
import { render } from "@/test/render"

const push = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const search = { query: "diabetes", location: "Braga", page: 2, near: null }
const near = { latitude: 41.551, longitude: -8.428 }

beforeEach(() => {
  push.mockClear()
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

describe("SortSelect", () => {
  it("sorts by distance from the guest's rounded position, from the first page", async () => {
    const user = userEvent.setup()
    render(<SortSelect search={search} />)

    await user.click(screen.getByRole("combobox", { name: "Sort by" }))
    await user.click(await screen.findByRole("option", { name: "Distance" }))

    expect(push).toHaveBeenCalledExactlyOnceWith("/?q=diabetes&location=Braga&latitude=41.551&longitude=-8.428")
  })

  it("goes back to relevance by dropping the position", async () => {
    const user = userEvent.setup()
    render(<SortSelect search={{ ...search, near }} />)

    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Distance")
    await user.click(screen.getByRole("combobox", { name: "Sort by" }))
    await user.click(await screen.findByRole("option", { name: "Relevance" }))

    expect(push).toHaveBeenCalledExactlyOnceWith("/?q=diabetes&location=Braga")
  })
})
