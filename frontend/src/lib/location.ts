import { CITIES, DEFAULT_CITY, type City } from "@/lib/nutritionists"
import { normalizeText } from "@/lib/text"

export type ResolvedLocation = {
  city: City
  source: "input" | "default" | "fallback"
}

const CITY_BY_KEY = new Map<string, City>([
  ...CITIES.map((city) => [normalizeText(city), city] as const),
  ["lisbon", "Lisboa"],
  ["oporto", "Porto"],
])

export function resolveLocation(input: string): ResolvedLocation {
  const key = normalizeText(input)
  if (!key) return { city: DEFAULT_CITY, source: "default" }
  const city = CITY_BY_KEY.get(key)
  return city
    ? { city, source: "input" }
    : { city: DEFAULT_CITY, source: "fallback" }
}
