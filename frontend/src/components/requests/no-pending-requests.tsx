import { InboxIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function NoPendingRequests() {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No pending requests</EmptyTitle>
        <EmptyDescription>
          New appointment requests from guests will show up here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
