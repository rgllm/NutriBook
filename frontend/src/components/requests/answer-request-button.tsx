"use client"

import { useFormStatus } from "react-dom"
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { RequestAnswer } from "@/lib/pending-requests"

const ANSWERS = {
  accepted: { label: "Accept", pendingLabel: "Accepting…", variant: "default", Icon: CheckIcon },
  rejected: { label: "Reject", pendingLabel: "Rejecting…", variant: "outline", Icon: XIcon },
} as const

export function AnswerRequestButton({
  answer,
  guestName,
}: {
  answer: RequestAnswer
  guestName: string
}) {
  const { pending, data } = useFormStatus()
  const { label, pendingLabel, variant, Icon } = ANSWERS[answer]
  const isRunning = pending && data?.get("status") === answer

  return (
    <Button
      type="submit"
      name="status"
      value={answer}
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
