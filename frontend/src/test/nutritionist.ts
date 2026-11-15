import type { Nutritionist } from "@/lib/api/nutritionists"

export const nutritionist: Nutritionist = {
  id: 1,
  name: "Mary Jane",
  title: "Dietitian",
  licenseNumber: "2963N",
  offersOnline: true,
  city: "Braga",
  addresses: ["Rua do Souto 45"],
  services: [{ id: 381, name: "Diabetes management", priceEur: 40, streetAddress: "Rua do Souto 45" }],
}
