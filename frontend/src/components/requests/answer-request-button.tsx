"use client"

import { useFormStatus } from "react-dom"
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { RequestDecision } from "@/lib/pending-requests"

const DECISIONS = {
  accept: { label: "Accept", pendingLabel: "Accepting…", variant: "default", Icon: CheckIcon },
  reject: { label: "Reject", pendingLabel: "Rejecting…", variant: "outline", Icon: XIcon },
} as const

export function AnswerRequestButton({
  decision,
  guestName,
}: {
  decision: RequestDecision
  guestName: string
}) {
  const { pending, data } = useFormStatus()
  const { label, pendingLabel, variant, Icon } = DECISIONS[decision]
  const isRunning = pending && data?.get("decision") === decision

  return (
    <Button
      type="submit"
      name="decision"
      value={decision}
      variant={variant}
      disabled={pending}
      aria-label={`${label} the request from ${guestName}`}
      className="w-full"
    >
      {isRunning ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        <Icon data-icon="inline-start" />
      )}
      {isRunning ? pendingLabel : label}
    </Button>
  )
}
