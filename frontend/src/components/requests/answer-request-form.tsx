"use client"

import { useActionState } from "react"

import { AnswerRequestButton } from "@/components/requests/answer-request-button"
import type { AnswerRequestState } from "@/lib/pending-requests"

const initialState: AnswerRequestState = { error: null }

export function AnswerRequestForm({
  action,
  guestName,
}: {
  action: (previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>
  guestName: string
}) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <AnswerRequestButton answer="accepted" guestName={guestName} />
        <AnswerRequestButton answer="rejected" guestName={guestName} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}
