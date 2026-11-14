"use client"

import { useState, type FormEvent } from "react"
import { format, startOfToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Nutritionist } from "@/lib/api/nutritionists"
import {
  isSlotInPast,
  TIME_SLOTS,
  validateAppointment,
  type AppointmentDraft,
  type AppointmentErrors,
  type AppointmentRequest,
  type TimeSlot,
} from "@/lib/appointment-request"

export function AppointmentForm({
  nutritionist,
  onSubmit,
}: {
  nutritionist: Nutritionist
  onSubmit: (request: AppointmentRequest) => void
}) {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<TimeSlot>()
  const [errors, setErrors] = useState<AppointmentErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const draft: AppointmentDraft = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      date,
      time,
    }
    const nextErrors = validateAppointment(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(draft as AppointmentRequest)
    }
  }

  const clearError = (key: keyof AppointmentErrors) =>
    setErrors((current) => ({ ...current, [key]: undefined }))

  function selectDate(next: Date | undefined) {
    setDate(next)
    if (time && isSlotInPast(next, time)) setTime(undefined)
    clearError("date")
  }

  function selectTime(values: string[]) {
    setTime(values[0] as TimeSlot | undefined)
    clearError("time")
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="text-subheading">
          Schedule an appointment
        </DialogTitle>
        <DialogDescription>
          With {nutritionist.name}, {nutritionist.title.toLowerCase()} in{" "}
          {nutritionist.city}. They will confirm your request by email.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="sm:flex-row">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="guest-name">Your name</FieldLabel>
          <Input
            id="guest-name"
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="guest-email">Email</FieldLabel>
          <Input
            id="guest-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend>Date and time</FieldLegend>
        <div className="flex flex-col gap-6 sm:flex-row">
          <Field className="sm:w-auto">
            <Calendar
              mode="single"
              selected={date}
              onSelect={selectDate}
              disabled={[{ before: startOfToday() }, { dayOfWeek: [0] }]}
              className="rounded-lg border p-0 sm:p-2"
            />
            <FieldError>{errors.date}</FieldError>
          </Field>
          <Field className="flex-1">
            <FieldLabel id="time-label">
              {date ? format(date, "EEEE, d MMMM") : "Time"}
            </FieldLabel>
            <ToggleGroup
              aria-labelledby="time-label"
              variant="outline"
              value={time ? [time] : []}
              onValueChange={selectTime}
              className="grid w-full grid-cols-3"
            >
              {TIME_SLOTS.map((slot) => (
                <ToggleGroupItem
                  key={slot}
                  value={slot}
                  disabled={!date || isSlotInPast(date, slot)}
                >
                  {slot}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {date ? (
              <FieldError>{errors.time}</FieldError>
            ) : (
              <FieldDescription>Pick a day to see available times.</FieldDescription>
            )}
          </Field>
        </div>
      </FieldSet>

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Request appointment</Button>
      </DialogFooter>
    </form>
  )
}
