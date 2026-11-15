import { CircleCheckIcon } from "lucide-react"

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
import { formatAppointmentStart } from "@/lib/format"

export function AppointmentRequestSent({
  nutritionist,
  request,
}: {
  nutritionist: Nutritionist
  request: CreatedAppointmentRequest
}) {
  return (
    <>
      <DialogHeader className="items-center text-center">
        <CircleCheckIcon aria-hidden className="size-12 text-brand" />
        <DialogTitle className="text-subheading">
          Appointment requested
        </DialogTitle>
        <DialogDescription className="max-w-[28rem] text-balance">
          You asked {nutritionist.name} for{" "}
          <strong className="text-foreground">
            {request.serviceName}
            {request.online && " (online)"} on {formatAppointmentStart(request.startsAt)}
          </strong>
          . This is not confirmed yet. We will email {request.guestEmail} once{" "}
          {nutritionist.name} answers your request.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <DialogClose render={<Button />}>Done</DialogClose>
      </DialogFooter>
    </>
  )
}
