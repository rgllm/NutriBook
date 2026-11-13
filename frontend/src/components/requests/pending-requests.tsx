import { NoPendingRequests } from "@/components/requests/no-pending-requests"
import { RequestCard } from "@/components/requests/request-card"
import { listPendingRequests } from "@/lib/pending-requests"

export async function PendingRequests({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Awaiting the params keeps the list request-time, so it is never cached.
  await params
  const requests = listPendingRequests()

  if (requests.length === 0) return <NoPendingRequests />

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <li key={request.id} className="flex">
          <RequestCard request={request} />
        </li>
      ))}
    </ul>
  )
}
