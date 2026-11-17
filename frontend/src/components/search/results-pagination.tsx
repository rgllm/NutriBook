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
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
}) {
  const t = useTranslations("search")

  return (
    <Pagination aria-label={t("pagination")}>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={hrefFor(page - 1)} aria-label={t("previousPage")} />
          </PaginationItem>
        )}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
          <PaginationItem key={target}>
            <PaginationLink href={hrefFor(target)} isActive={target === page}>
              {target}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < pageCount && (
          <PaginationItem>
            <PaginationNext href={hrefFor(page + 1)} aria-label={t("nextPage")} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}
