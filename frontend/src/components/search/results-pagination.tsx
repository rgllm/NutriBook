import type { MouseEvent } from "react"
import { useTranslations } from "next-intl"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function ResultsPagination({
  page,
  pageCount,
  hrefFor,
  onSelect,
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
  // Takes over from the link, for a search the URL cannot hold.
  onSelect?: (page: number) => void
}) {
  const t = useTranslations("search")
  const linkTo = (target: number) => ({
    href: hrefFor(target),
    onClick: onSelect && ((event: MouseEvent) => {
      event.preventDefault()
      onSelect(target)
    }),
  })

  return (
    <Pagination aria-label={t("pagination")}>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious {...linkTo(page - 1)} aria-label={t("previousPage")} />
          </PaginationItem>
        )}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
          <PaginationItem key={target}>
            <PaginationLink {...linkTo(target)} isActive={target === page}>
              {target}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < pageCount && (
          <PaginationItem>
            <PaginationNext {...linkTo(page + 1)} aria-label={t("nextPage")} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}
