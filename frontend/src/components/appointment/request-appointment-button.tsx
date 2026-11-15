"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RequestAppointmentButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
      {pending ? "Requesting…" : "Request appointment"}
    </Button>
  )
}
