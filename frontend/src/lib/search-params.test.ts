import { describe, expect, it } from "vitest"

import { parseSearchParams, searchHref } from "@/lib/search-params"

describe("parseSearchParams", () => {
  it("reads the query, location, and page", () => {
    expect(parseSearchParams({ q: "follow", location: "Porto", page: "2" })).toEqual({
      query: "follow",
      location: "Porto",
      page: 2,
      near: null,
    })
  })

  it("uses the first value of a repeated param", () => {
    expect(
      parseSearchParams({ q: ["follow", "sports"], location: ["Porto", "Braga"], page: ["3", "4"] }),
    ).toEqual({ query: "follow", location: "Porto", page: 3, near: null })
  })

  it("trims padded values and turns blank ones into empty strings", () => {
    expect(parseSearchParams({ q: "  follow up  ", location: "   ", page: " 2 " })).toEqual({
      query: "follow up",
      location: "",
      page: 2,
      near: null,
    })
  })

  it("defaults every field when the params are missing", () => {
    expect(parseSearchParams({})).toEqual({ query: "", location: "", page: 1, near: null })
    expect(parseSearchParams({ q: [], location: undefined })).toEqual({
      query: "",
      location: "",
      page: 1,
      near: null,
    })
  })

  it.each(["", "abc", "0", "-2", "1.5", "Infinity"])("turns page %j into page 1", (page) => {
    expect(parseSearchParams({ page }).page).toBe(1)
  })

  it("reads a position from both coordinates", () => {
    expect(parseSearchParams({ latitude: "41.551", longitude: "-8.428" }).near).toEqual({
      latitude: 41.551,
      longitude: -8.428,
    })
  })

  it.each([
    { latitude: "41.551" },
    { latitude: "", longitude: "-8.428" },
    { latitude: "north", longitude: "-8.428" },
    { latitude: "91", longitude: "-8.428" },
    { latitude: "41.551", longitude: "-181" },
  ])("ignores an incomplete or invalid position %j", (params) => {
    expect(parseSearchParams(params).near).toBeNull()
  })
})

describe("searchHref", () => {
  it("links to the root when the search is empty", () => {
    expect(searchHref({ query: "", location: "", page: 1, near: null })).toBe("/")
  })

  it("keeps every param that has a value", () => {
    expect(
      searchHref({ query: "follow up", location: "Porto", page: 2, near: { latitude: 41.551, longitude: -8.428 } }),
    ).toBe("/?q=follow+up&location=Porto&page=2&latitude=41.551&longitude=-8.428")
  })

  it("drops empty params and page 1", () => {
    expect(searchHref({ query: "", location: "Porto", page: 1, near: null })).toBe("/?location=Porto")
    expect(searchHref({ query: "follow", location: "", page: 1, near: null })).toBe("/?q=follow")
  })
})
