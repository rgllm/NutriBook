"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

export function RequestAppointmentButton() {
  const { pending } = useFormStatus()
  const t = useTranslations("appointment")

  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
      {pending ? t("submitting") : t("submit")}
    </Button>
  )
}
