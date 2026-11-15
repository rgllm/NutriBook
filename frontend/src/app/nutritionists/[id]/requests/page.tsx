import type { Metadata } from "next"
import { Suspense } from "react"

import { PendingRequests } from "@/components/requests/pending-requests"
import { RequestsSkeleton } from "@/components/requests/requests-skeleton"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "NutriBook · Pending requests",
}

export default function NutritionistRequestsPage({
  params,
}: PageProps<"/nutritionists/[id]/requests">) {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<RequestsSkeleton />}>
          <PendingRequests params={params} />
        </Suspense>
      </main>
    </>
  )
}
