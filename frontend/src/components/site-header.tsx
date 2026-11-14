import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRightIcon, LeafIcon } from "lucide-react"

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-brand text-ink [--ring:var(--color-ink)]">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 font-heading text-subheading"
        >
          <LeafIcon aria-hidden className="size-6" />
          NutriBook
        </Link>
        <Link
          href="#"
          className="inline-flex h-11 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <span className="hidden sm:inline">
            Are you a nutrition professional? Get to know our software
          </span>
          <span className="sm:hidden">For nutritionists</span>
          <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
      </div>
      {children && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-2 pb-8 sm:px-8">{children}</div>
      )}
    </header>
  )
}
