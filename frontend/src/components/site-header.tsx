import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"

export async function SiteHeader({ children }: { children?: ReactNode }) {
  const t = await getTranslations("siteHeader")

  return (
    <>
      <div className="bg-brand-ink text-primary-foreground [--ring:white]">
        <div className="mx-auto flex w-full max-w-5xl justify-end px-4 py-1 sm:px-8">
          <LocaleSwitcher />
        </div>
      </div>
      <header className="bg-primary text-primary-foreground [--ring:white]">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex h-11 items-center font-heading text-subheading"
          >
            NutriBook
          </Link>
          <Link
            href="https://nutrium.com/"
            className="inline-flex h-11 items-center gap-1.5 text-sm font-medium whitespace-nowrap underline-offset-4 hover:underline"
          >
            <span className="hidden sm:inline">{t("forProfessionals")}</span>
            <span className="sm:hidden">{t("forProfessionalsShort")}</span>
            <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
        </div>
        {children && (
          <div className="mx-auto w-full max-w-5xl px-4 pt-2 pb-8 sm:px-8">{children}</div>
        )}
      </header>
    </>
  )
}
