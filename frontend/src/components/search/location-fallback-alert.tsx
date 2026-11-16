import { InfoIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LocationFallbackAlert({ input, city }: { input: string; city: string }) {
  const t = useTranslations("search")

  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>{t("unknownLocationTitle", { input })}</AlertTitle>
      <AlertDescription>{t("unknownLocationDescription", { city })}</AlertDescription>
    </Alert>
  )
}
