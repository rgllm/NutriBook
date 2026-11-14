import Link from "next/link"
import { SearchXIcon } from "lucide-react"

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
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>No nutritionists found</EmptyTitle>
        <EmptyDescription>
          {query
            ? `Nobody in ${city} matches “${query}”. Try another name or service.`
            : `There are no nutritionists in ${city} yet. Try a nearby city.`}
        </EmptyDescription>
      </EmptyHeader>
      {query && (
        <EmptyContent>
          <Link href={clearHref} className={buttonVariants({ variant: "outline" })}>
            Clear search
          </Link>
        </EmptyContent>
      )}
    </Empty>
  )
}
