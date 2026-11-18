"use client"

import { useFormStatus } from "react-dom"
import { CheckIcon, LoaderCircleIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { RequestOverlap } from "@/lib/api/appointment-requests"

// Accept for a request that overlaps others: it opens a confirmation listing
// the requests accepting will reject. The confirm button submits the card's
// form, which the dialog's portal sits outside of, through its id.
export function AcceptOverlappingDialog({
  formId,
  guestName,
  overlaps,
  open,
  onOpenChange,
}: {
  formId: string
  guestName: string
  overlaps: RequestOverlap[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("requests")
  const format = useFormatter()
  const { pending } = useFormStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button className="w-full" />}
        disabled={pending}
        aria-label={t("acceptLabel", { guest: guestName })}
      >
        <CheckIcon data-icon="inline-start" />
        {t("accept")}
      </DialogTrigger>
      <DialogContent closeLabel={t("close")} className="gap-5 sm:max-w-[28rem] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-subheading">
            {t("confirmAcceptTitle", { guest: guestName })}
          </DialogTitle>
          <DialogDescription>
            {t("confirmAcceptDescription", { count: overlaps.length })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {overlaps.map((overlap) => (
            <li key={overlap.id} className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
              <span className="font-medium">{overlap.guestName}</span>
              <span className="text-muted-foreground">
                {overlap.serviceName},{" "}
                <time dateTime={overlap.startsAt.toISOString()} className="tabular-nums">
                  {format.dateTimeRange(overlap.startsAt, overlap.endsAt, "time")}
                </time>
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter className="sm:-mx-6 sm:-mb-6 sm:px-6">
          <DialogClose render={<Button variant="outline" />}>{t("cancel")}</DialogClose>
          <Button type="submit" form={formId} name="status" value="accepted" disabled={pending}>
            {pending ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckIcon data-icon="inline-start" />
            )}
            {pending ? t("accepting") : t("confirmAccept", { count: overlaps.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
