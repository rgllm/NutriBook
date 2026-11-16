export type SearchParams = Record<string, string | string[] | undefined>

export type SearchState = {
  query: string
  location: string
  page: number
}

const firstValue = (value: string | string[] | undefined) =>
  ((Array.isArray(value) ? value[0] : value) ?? "").trim()

const pageNumber = (value: string) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function parseSearchParams(params: SearchParams): SearchState {
  return {
    query: firstValue(params.q),
    location: firstValue(params.location),
    page: pageNumber(firstValue(params.page)),
  }
}

export function searchQuery({ query, location, page }: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (location) params.set("location", location)
  if (page > 1) params.set("page", String(page))
  return params
}

export function searchHref(search: SearchState): string {
  const query = searchQuery(search).toString()
  return query ? `/?${query}` : "/"
}
