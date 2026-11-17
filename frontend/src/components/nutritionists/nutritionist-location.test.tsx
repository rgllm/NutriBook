import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { NutritionistLocation } from "@/components/nutritionists/nutritionist-location"
import { render } from "@/test/render"

describe("NutritionistLocation", () => {
  it("shows how far each practice is when the search measured it", () => {
    render(
      <NutritionistLocation
        addresses={[
          { streetAddress: "Rua do Souto", city: "Braga", distanceKm: 1.234 },
          { streetAddress: "Rua de Cedofeita", city: "Porto", distanceKm: null },
        ]}
      />,
    )

    const [braga, porto] = screen.getAllByRole("listitem")
    expect(braga).toHaveTextContent("Rua do SoutoBraga1.2 km away")
    expect(porto).toHaveTextContent(/^Rua de CedofeitaPorto$/)
  })
})
