export type SearchParams = Record<string, string | string[] | undefined>

export type SearchState = {
  query: string
  location: string
  page: number
}

const firstValue = (value: string | string[] | undefined) =>
  ((Array.isArray(value) ? value[0] : value) ?? "").trim()

export function parseSearchParams(params: SearchParams): SearchState {
  return {
    query: firstValue(params.q),
    location: firstValue(params.location),
    page: Number(firstValue(params.page)) || 1,
  }
}

export function searchHref({ query, location, page }: SearchState): string {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (location) params.set("location", location)
  if (page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/?${search}` : "/"
}
