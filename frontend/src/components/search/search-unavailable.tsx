import { CloudOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SearchUnavailable({ retryHref }: { retryHref: string }) {
  const t = useTranslations("Search")

  return (
    <Alert variant="destructive">
      <CloudOffIcon />
      <AlertTitle>{t("unavailableTitle")}</AlertTitle>
      <AlertDescription>
        {t.rich("unavailableDescription", {
          retry: (chunks) => (
            <a href={retryHref} className="underline underline-offset-4">
              {chunks}
            </a>
          ),
        })}
      </AlertDescription>
    </Alert>
  )
}
