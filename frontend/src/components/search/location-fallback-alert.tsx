import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CITIES, type City } from "@/lib/nutritionists"

export function LocationFallbackAlert({ input, city }: { input: string; city: City }) {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>We don&apos;t know &ldquo;{input}&rdquo; yet</AlertTitle>
      <AlertDescription>
        Showing nutritionists in {city} instead. Try one of: {CITIES.join(", ")}.
      </AlertDescription>
    </Alert>
  )
}
