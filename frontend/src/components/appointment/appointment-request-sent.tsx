import { format } from "date-fns"
import { CircleCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AppointmentRequest } from "@/lib/appointment-request"
import type { Nutritionist } from "@/lib/api/nutritionists"

export function AppointmentRequestSent({
  nutritionist,
  request,
}: {
  nutritionist: Nutritionist
  request: AppointmentRequest
}) {
  const service = nutritionist.services.find(({ id }) => id === request.serviceId)
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
            {service?.name}
            {request.online && " (online)"} on{" "}
            {format(request.date, "EEEE, d MMMM")} at {request.time}
          </strong>
          . This is not confirmed yet. We will email {request.email} once{" "}
          {nutritionist.name} accepts it.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <DialogClose render={<Button />}>Done</DialogClose>
      </DialogFooter>
    </>
  )
}
