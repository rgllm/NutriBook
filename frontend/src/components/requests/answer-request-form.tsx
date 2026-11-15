"use client"

import { useActionState } from "react"
import { toast } from "sonner"

import { AnswerRequestButton } from "@/components/requests/answer-request-button"
import { answeredMessage, type AnswerRequestState } from "@/lib/pending-requests"

const initialState: AnswerRequestState = { status: "idle" }

export function AnswerRequestForm({
  action,
  guestName,
}: {
  action: (previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>
  guestName: string
}) {
  // The toast is raised here, as the result arrives, because a refreshed list
  // unmounts this card before it could render anything.
  const [state, formAction] = useActionState(
    async (previous: AnswerRequestState, formData: FormData) => {
      const next = await action(previous, formData)
      if (next.status === "answered") {
        toast.success(answeredMessage(next.answer, guestName, next.rejectedCount))
      } else if (next.status === "gone") {
        toast.error(next.message)
      }
      return next
    },
    initialState,
  )

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <AnswerRequestButton answer="accepted" guestName={guestName} />
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
