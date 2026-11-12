import { NUTRITIONISTS, type City, type Nutritionist } from "@/lib/nutritionists"
import { normalizeText } from "@/lib/text"

export function searchNutritionists(query: string, city: City): Nutritionist[] {
  const needle = normalizeText(query)
  return NUTRITIONISTS.filter(
    (nutritionist) =>
      nutritionist.city === city &&
      (!needle ||
        [
          nutritionist.name,
          nutritionist.title,
          ...nutritionist.services.map((service) => service.name),
        ].some((field) => normalizeText(field).includes(needle))),
  )
}
