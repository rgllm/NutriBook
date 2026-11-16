import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SearchForm } from "@/components/search/search-form"
import { render } from "@/test/render"

vi.mock("server-only", () => ({}))
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

  it("takes no input while disabled", () => {
    render(<SearchForm disabled />)

    for (const control of controls()) expect(control).toBeDisabled()
  })
})
