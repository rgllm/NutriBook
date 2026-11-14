import { describe, expect, it } from "vitest"

import { formatEuros } from "@/lib/format"

describe("formatEuros", () => {
  it("puts the symbol after the amount", () => {
    expect(formatEuros(39)).toBe("39€")
  })

  it("shows cents only when there are any", () => {
    expect(formatEuros(19.5)).toBe("19.50€")
  })
})
