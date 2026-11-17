import { notFound } from "next/navigation"

import { NoPendingRequests } from "@/components/requests/no-pending-requests"
import { RequestCard } from "@/components/requests/request-card"
import { RequestsHeading } from "@/components/requests/requests-heading"
import { overlappingRequests } from "@/lib/pending-requests"
import { getPendingRequests } from "@/lib/api/appointment-requests"

export async function PendingRequests({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pending = await getPendingRequests(id)
  if (!pending) notFound()

  return (
    <>
      <RequestsHeading nutritionistName={pending.nutritionist.name} />
      {pending.requests.length === 0 ? (
        <NoPendingRequests />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pending.requests.map((request) => (
            <li key={request.id} className="flex">
              <RequestCard nutritionistId={id} request={request} overlaps={overlappingRequests(request, pending.requests)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
