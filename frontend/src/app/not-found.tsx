import Link from "next/link"
import { SearchXIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { SiteHeader } from "@/components/site-header"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export default function NotFound() {
  const t = useTranslations("NotFoundPage")

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-10">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("description")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              {t("back")}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    </>
  )
}
