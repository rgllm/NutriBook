"use client"

import { CalendarPlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { AppointmentFlow } from "@/components/appointment/appointment-flow"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { Nutritionist } from "@/lib/api/nutritionists"

export function ScheduleAppointmentDialog({
  nutritionist,
}: {
  nutritionist: Nutritionist
}) {
  const t = useTranslations("nutritionist")

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="coral-soft" className="w-full" />}
        aria-label={t("scheduleAppointmentWith", { name: nutritionist.name })}
      >
        <CalendarPlusIcon data-icon="inline-start" />
        {t("scheduleAppointment")}
      </DialogTrigger>
      <DialogContent closeLabel={t("close")} className="gap-6 sm:max-w-[42rem] sm:p-6">
        <AppointmentFlow nutritionist={nutritionist} />
      </DialogContent>
    </Dialog>
  )
}
