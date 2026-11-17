"use client"

import { useActionState, useRef, useState } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AnswerRequestButton } from "@/components/requests/answer-request-button"
import type { AnswerRequestState } from "@/lib/pending-requests"

const initialState: AnswerRequestState = { status: "idle" }

export function AnswerRequestForm({
  action,
  guestName,
  overlappingGuests = [],
}: {
  action: (previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>
  guestName: string
  overlappingGuests?: string[]
}) {
  const t = useTranslations("requests")
  const format = useFormatter()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirming, setConfirming] = useState(false)
  // The toast is raised here, as the result arrives, because a refreshed list
  // unmounts this card before it could render anything.
  const [state, formAction, pending] = useActionState(
    async (previous: AnswerRequestState, formData: FormData) => {
      const next = await action(previous, formData)
      if (next.status === "answered" || next.status === "gone") setConfirming(false)
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

  const error = state.status === "failed" && (
    <p role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  )

  return (
    <Dialog open={confirming} onOpenChange={(open) => {
      if (!pending) setConfirming(open)
    }}>
      <form action={formAction} className="flex w-full flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {overlappingGuests.length > 0 ? (
            <DialogTrigger render={
              <Button type="button" disabled={pending} aria-label={t("acceptLabel", { guest: guestName })} />
            }>
              <CheckIcon data-icon="inline-start" />
              {t("accept")}
            </DialogTrigger>
          ) : (
            <AnswerRequestButton answer="accepted" guestName={guestName} />
          )}
          <AnswerRequestButton answer="rejected" guestName={guestName} />
        </div>
        {!confirming && error}
      </form>
      <DialogContent showCloseButton={false} initialFocus={cancelRef}>
        <DialogHeader>
          <DialogTitle className="font-heading text-subheading">
            {t("confirmTitle", { guest: guestName })}
          </DialogTitle>
          <DialogDescription>
            {t("confirmDescription", { guests: format.list(overlappingGuests) })}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("previewNotice")}</p>
        <form action={formAction} className="flex flex-col gap-4">
          {error}
          <DialogFooter>
            <Button ref={cancelRef} type="button" variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <AnswerRequestButton answer="accepted" guestName={guestName} className="w-full sm:w-auto" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
