import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PrefilledSearchForm } from "@/components/search/prefilled-search-form"
import { render } from "@/test/render"

vi.mock("server-only", () => ({}))
vi.mock("next/form", () => ({ default: (props: React.ComponentProps<"form">) => <form {...props} /> }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("PrefilledSearchForm", () => {
  it("renders usable fields from the URL while the API hangs", async () => {
    const fetch = vi.fn(() => new Promise<never>(() => {}))
    vi.stubGlobal("fetch", fetch)

    render(await PrefilledSearchForm({ searchParams: Promise.resolve({ q: "joao", location: "Porto" }) }))

    const query = screen.getByLabelText("Nutritionist or service")
    const location = screen.getByLabelText("Location")
    expect(query).toHaveValue("joao")
    expect(location).toHaveValue("Porto")
    // The suggestions asked for the cities and are still waiting.
    expect(fetch).toHaveBeenCalledOnce()

    await userEvent.clear(location)
    await userEvent.type(location, "Lisboa")
    expect(location).toHaveValue("Lisboa")
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled()
  })
})
