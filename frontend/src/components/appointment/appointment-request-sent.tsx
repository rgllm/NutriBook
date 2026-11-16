import { CircleCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CreatedAppointmentRequest } from "@/lib/api/appointment-requests"
import type { Nutritionist } from "@/lib/api/nutritionists"

export function AppointmentRequestSent({
  nutritionist,
  request,
}: {
  nutritionist: Nutritionist
  request: CreatedAppointmentRequest
}) {
  const t = useTranslations("appointment")

  return (
    <>
      <DialogHeader className="items-center text-center">
        <CircleCheckIcon aria-hidden className="size-12 text-brand" />
        <DialogTitle className="text-subheading">
          {t("sentTitle")}
        </DialogTitle>
        <DialogDescription className="max-w-[28rem] text-balance">
          {t.rich("sentDescription", {
            nutritionist: nutritionist.name,
            service: request.serviceName,
            online: String(request.online),
            start: request.startsAt,
            email: request.guestEmail,
            strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
          })}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <DialogClose render={<Button />}>{t("done")}</DialogClose>
      </DialogFooter>
    </>
  )
}
