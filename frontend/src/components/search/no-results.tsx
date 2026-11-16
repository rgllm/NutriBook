import Link from "next/link"
import { SearchXIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function NoResults({
  city,
  query,
  clearHref,
}: {
  city: string
  query: string
  clearHref: string
}) {
  const t = useTranslations("search")

  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t("noResultsTitle")}</EmptyTitle>
        <EmptyDescription>
          {query ? t("noMatch", { city, query }) : t("noneInCity", { city })}
        </EmptyDescription>
      </EmptyHeader>
      {query && (
        <EmptyContent>
          <Link href={clearHref} className={buttonVariants({ variant: "outline" })}>
            {t("clearSearch")}
          </Link>
        </EmptyContent>
      )}
    </Empty>
  )
}
