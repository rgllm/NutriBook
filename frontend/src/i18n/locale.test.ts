import { describe, expect, it } from "vitest"

import { negotiateLocale } from "@/i18n/locale"

describe("negotiateLocale", () => {
  it("uses the locale the visitor picked", () => {
    expect(negotiateLocale("pt-PT", "en-GB,en;q=0.9")).toBe("pt-PT")
  })

  it("ignores a cookie that names no supported locale", () => {
    expect(negotiateLocale("fr-FR", "pt-PT")).toBe("pt-PT")
  })

  it("serves any Portuguese browser in European Portuguese", () => {
    expect(negotiateLocale(undefined, "pt-BR,pt;q=0.9")).toBe("pt-PT")
  })

  it("follows the browser's ranking, not the header's order", () => {
    expect(negotiateLocale(undefined, "en;q=0.5,pt;q=0.8")).toBe("pt-PT")
  })

  it("skips languages it does not offer", () => {
    expect(negotiateLocale(undefined, "fr-FR,fr;q=0.9,pt;q=0.7,en;q=0.6")).toBe("pt-PT")
  })

  it("skips a language the browser refuses with q=0", () => {
    expect(negotiateLocale(undefined, "pt;q=0,en;q=0.5")).toBe("en-GB")
  })

  it("falls back to English", () => {
    expect(negotiateLocale(undefined, "fr-FR")).toBe("en-GB")
    expect(negotiateLocale(undefined, null)).toBe("en-GB")
    expect(negotiateLocale(undefined, "*")).toBe("en-GB")
  })
})
