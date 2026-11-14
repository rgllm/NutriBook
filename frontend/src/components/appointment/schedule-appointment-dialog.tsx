"use client"

import { CalendarPlusIcon } from "lucide-react"

import { AppointmentFlow } from "@/components/appointment/appointment-flow"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { Nutritionist } from "@/lib/api/nutritionists"

export function ScheduleAppointmentDialog({
  nutritionist,
}: {
  nutritionist: Nutritionist
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="w-full" />}>
        <CalendarPlusIcon data-icon="inline-start" />
        Schedule appointment
      </DialogTrigger>
      <DialogContent className="gap-6 sm:max-w-[42rem] sm:p-6">
        <AppointmentFlow nutritionist={nutritionist} />
      </DialogContent>
    </Dialog>
  )
}
