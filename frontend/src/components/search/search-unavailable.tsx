import { CloudOffIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SearchUnavailable({ retryHref }: { retryHref: string }) {
  return (
    <Alert variant="destructive">
      <CloudOffIcon />
      <AlertTitle>Search is unavailable right now</AlertTitle>
      <AlertDescription>
        We couldn&apos;t reach the nutritionist directory.{" "}
        <a href={retryHref} className="underline underline-offset-4">
          Try again
        </a>
        .
      </AlertDescription>
    </Alert>
  )
}
