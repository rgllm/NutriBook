"use client"

import { useActionState } from "react"

import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"
import { AnswerRequestButton } from "@/components/requests/answer-request-button"
import type { AnswerRequestState } from "@/lib/pending-requests"

const initialState: AnswerRequestState = { error: null }

export function AnswerRequestForm({
  requestId,
  guestName,
}: {
  requestId: string
  guestName: string
}) {
  const [state, formAction] = useActionState(
    answerRequest.bind(null, requestId),
    initialState,
  )

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <AnswerRequestButton decision="accept" guestName={guestName} />
        <AnswerRequestButton decision="reject" guestName={guestName} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}
