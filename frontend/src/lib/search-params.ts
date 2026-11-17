export type SearchParams = Record<string, string | string[] | undefined>

export type Position = { latitude: number; longitude: number }

export type SearchState = {
  query: string
  location: string
  page: number
  near: Position | null
}

const firstValue = (value: string | string[] | undefined) =>
  ((Array.isArray(value) ? value[0] : value) ?? "").trim()

const pageNumber = (value: string) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const coordinate = (value: string, limit: number) => {
  const degrees = value === "" ? NaN : Number(value)
  return Math.abs(degrees) <= limit ? degrees : null
}

function position(params: SearchParams): Position | null {
  const latitude = coordinate(firstValue(params.latitude), 90)
  const longitude = coordinate(firstValue(params.longitude), 180)
  return latitude === null || longitude === null ? null : { latitude, longitude }
}

export function parseSearchParams(params: SearchParams): SearchState {
  return {
    query: firstValue(params.q),
    location: firstValue(params.location),
    page: pageNumber(firstValue(params.page)),
    near: position(params),
  }
}

export function searchQuery({ query, location, page, near }: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (location) params.set("location", location)
  if (page > 1) params.set("page", String(page))
  if (near) {
    params.set("latitude", String(near.latitude))
    params.set("longitude", String(near.longitude))
  }
  return params
}

export function searchHref(search: SearchState): string {
  const query = searchQuery(search).toString()
  return query ? `/?${query}` : "/"
}
