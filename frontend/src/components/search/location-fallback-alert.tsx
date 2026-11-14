import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LocationFallbackAlert({ input, city }: { input: string; city: string }) {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>We don&apos;t know &ldquo;{input}&rdquo; yet</AlertTitle>
      <AlertDescription>
        Showing nutritionists in {city} instead. Pick a city from the location suggestions.
      </AlertDescription>
    </Alert>
  )
}
