import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SearchForm } from "@/components/search/search-form"
import { render } from "@/test/render"

vi.mock("next/form", () => ({ default: (props: React.ComponentProps<"form">) => <form {...props} /> }))

const controls = () => [
  screen.getByLabelText("Nutritionist or service"),
  screen.getByLabelText("Location"),
  screen.getByRole("button", { name: "Search" }),
]

describe("SearchForm", () => {
  it("fills the fields from the current search", () => {
    render(<SearchForm query="joao" location="Porto" />)

    expect(screen.getByLabelText("Nutritionist or service")).toHaveValue("joao")
    expect(screen.getByLabelText("Location")).toHaveValue("Porto")
    for (const control of controls()) expect(control).toBeEnabled()
  })

  it("searches the default city when the location is left blank, and shows it", async () => {
    render(<SearchForm locations={{ locations: ["Braga", "Porto"], default: "Braga" }} />)
    const form = screen.getByRole("search") as HTMLFormElement
    const submitted = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener("submit", submitted)

    await userEvent.click(screen.getByRole("button", { name: "Search" }))

    expect(submitted).toHaveBeenCalledOnce()
    expect(screen.getByLabelText("Location")).toHaveValue("Braga")
  })

  it("keeps the distance order on a new search", () => {
    render(<SearchForm query="diabetes" location="Braga" near={{ latitude: 41.551, longitude: -8.428 }} />)

    const data = new FormData(screen.getByRole("search") as HTMLFormElement)
    expect(Object.fromEntries(data)).toEqual({
      q: "diabetes",
      location: "Braga",
      latitude: "41.551",
      longitude: "-8.428",
    })
  })
})
