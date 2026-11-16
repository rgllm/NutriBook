"use client"

import { useFormStatus } from "react-dom"
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { RequestAnswer } from "@/lib/pending-requests"

const ANSWERS = {
  accepted: { label: "accept", pendingLabel: "accepting", ariaLabel: "acceptLabel", variant: "default", Icon: CheckIcon },
  rejected: { label: "reject", pendingLabel: "rejecting", ariaLabel: "rejectLabel", variant: "outline", Icon: XIcon },
} as const

export function AnswerRequestButton({
  answer,
  guestName,
}: {
  answer: RequestAnswer
  guestName: string
}) {
  const { pending, data } = useFormStatus()
  const t = useTranslations("requests")
  const { label, pendingLabel, ariaLabel, variant, Icon } = ANSWERS[answer]
  const isRunning = pending && data?.get("status") === answer

  return (
    <Button
      type="submit"
      name="status"
      value={answer}
      variant={variant}
      disabled={pending}
      aria-label={t(ariaLabel, { guest: guestName })}
      className="w-full"
    >
      {isRunning ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        <Icon data-icon="inline-start" />
      )}
      {t(isRunning ? pendingLabel : label)}
    </Button>
  )
}
