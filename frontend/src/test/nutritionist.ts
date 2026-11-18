import type { Nutritionist } from "@/lib/api/nutritionists"

export const nutritionist: Nutritionist = {
  id: 1,
  name: "Mary Jane",
  title: "Dietitian",
  licenseNumber: "2963N",
  offersOnline: true,
  city: "Braga",
  nearestServiceId: null,
  addresses: [{ streetAddress: "Rua do Souto 45", city: "Braga", distanceKm: null }],
  services: [
    {
      id: 381,
      name: "Diabetes management",
      priceEur: 40,
      durationMinutes: 60,
      streetAddress: "Rua do Souto 45",
      city: "Braga",
      distanceKm: null,
      takenSlots: [],
    },
  ],
}
