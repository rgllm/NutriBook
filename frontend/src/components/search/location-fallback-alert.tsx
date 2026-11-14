import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LocationFallbackAlert({
  input,
  city,
  knownCities,
}: {
  input: string
  city: string
  knownCities: string[]
}) {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>We don&apos;t know &ldquo;{input}&rdquo; yet</AlertTitle>
      <AlertDescription>
        Showing nutritionists in {city} instead. Try one of: {knownCities.join(", ")}.
      </AlertDescription>
    </Alert>
  )
}
