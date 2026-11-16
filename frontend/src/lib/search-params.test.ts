import { describe, expect, it } from "vitest"

import { parseSearchParams, searchHref } from "@/lib/search-params"

describe("parseSearchParams", () => {
  it("reads the query, location, and page", () => {
    expect(parseSearchParams({ q: "follow", location: "Porto", page: "2" })).toEqual({
      query: "follow",
      location: "Porto",
      page: 2,
    })
  })

  it("uses the first value of a repeated param", () => {
    expect(
      parseSearchParams({ q: ["follow", "sports"], location: ["Porto", "Braga"], page: ["3", "4"] }),
    ).toEqual({ query: "follow", location: "Porto", page: 3 })
  })

  it("trims padded values and turns blank ones into empty strings", () => {
    expect(parseSearchParams({ q: "  follow up  ", location: "   ", page: " 2 " })).toEqual({
      query: "follow up",
      location: "",
      page: 2,
    })
  })

  it("defaults every field when the params are missing", () => {
    expect(parseSearchParams({})).toEqual({ query: "", location: "", page: 1 })
    expect(parseSearchParams({ q: [], location: undefined })).toEqual({
      query: "",
      location: "",
      page: 1,
    })
  })

  it.each(["", "abc", "0", "-2", "1.5", "Infinity"])("turns page %j into page 1", (page) => {
    expect(parseSearchParams({ page }).page).toBe(1)
  })
})

describe("searchHref", () => {
  it("links to the root when the search is empty", () => {
    expect(searchHref({ query: "", location: "", page: 1 })).toBe("/")
  })

  it("keeps every param that has a value", () => {
    expect(searchHref({ query: "follow up", location: "Porto", page: 2 })).toBe(
      "/?q=follow+up&location=Porto&page=2",
    )
  })

  it("drops empty params and page 1", () => {
    expect(searchHref({ query: "", location: "Porto", page: 1 })).toBe("/?location=Porto")
    expect(searchHref({ query: "follow", location: "", page: 1 })).toBe("/?q=follow")
  })
})
