"use client"

import { useActionState, useId, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { AcceptOverlappingDialog } from "@/components/requests/accept-overlapping-dialog"
import { AnswerRequestButton } from "@/components/requests/answer-request-button"
import type { RequestOverlap } from "@/lib/api/appointment-requests"
import type { AnswerRequestState } from "@/lib/pending-requests"

const initialState: AnswerRequestState = { status: "idle" }

export function AnswerRequestForm({
  action,
  guestName,
  overlaps,
}: {
  action: (previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>
  guestName: string
  overlaps: RequestOverlap[]
}) {
  const t = useTranslations("requests")
  const formId = useId()
  const [confirming, setConfirming] = useState(false)
  // The toast is raised here, as the result arrives, because a refreshed list
  // unmounts this card before it could render anything.
  const [state, formAction] = useActionState(
    async (previous: AnswerRequestState, formData: FormData) => {
      const next = await action(previous, formData)
      // A failure shows under the card's buttons, which the dialog covers.
      setConfirming(false)
      if (next.status === "answered") {
        toast.success(
          t("answered", { answer: next.answer, guest: guestName, rejected: next.rejectedCount }),
        )
      } else if (next.status === "gone") {
        toast.error(next.message)
      }
      return next
    },
    initialState,
  )

  return (
    <form id={formId} action={formAction} className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {overlaps.length > 0 ? (
          <AcceptOverlappingDialog
            formId={formId}
            guestName={guestName}
            overlaps={overlaps}
            open={confirming}
            onOpenChange={setConfirming}
          />
        ) : (
          <AnswerRequestButton answer="accepted" guestName={guestName} />
        )}
        <AnswerRequestButton answer="rejected" guestName={guestName} />
      </div>
      {state.status === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}
