"use client"

import { useState } from "react"
import { format, startOfToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RequestAppointmentButton } from "@/components/appointment/request-appointment-button"
import type { Nutritionist } from "@/lib/api/nutritionists"
import {
  isSlotInPast,
  TIME_SLOTS,
  type AppointmentErrors,
  type RequestAppointmentState,
  type TimeSlot,
} from "@/lib/appointment-request"

type EditingState = Extract<RequestAppointmentState, { status: "editing" }>

export function AppointmentForm({
  nutritionist,
  state,
  action,
}: {
  nutritionist: Nutritionist
  state: EditingState
  action: (formData: FormData) => void
}) {
  const { services } = nutritionist
  const [serviceId, setServiceId] = useState(
    services.length === 1 ? services[0].id : undefined,
  )
  const [online, setOnline] = useState(false)
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<TimeSlot>()
  // The API's errors for the last submission, minus those the guest has since
  // addressed by changing the field.
  const [errors, setErrors] = useState(state.errors)
  const [answeredState, setAnsweredState] = useState(state)
  if (state !== answeredState) {
    setAnsweredState(state)
    setErrors(state.errors)
  }

  const clearError = (key: keyof AppointmentErrors) =>
    setErrors((current) => ({ ...current, [key]: undefined }))

  function selectService(next: number | null) {
    setServiceId(next ?? undefined)
    clearError("service")
  }

  function selectOnline(next: boolean) {
    setOnline(next)
    clearError("online")
  }

  function selectDate(next: Date | undefined) {
    setDate(next)
    if (time && isSlotInPast(next, time)) setTime(undefined)
    clearError("when")
  }

  function selectTime(values: string[]) {
    setTime(values[0] as TimeSlot | undefined)
    clearError("when")
  }

  return (
    <form noValidate action={action} className="flex flex-col gap-6">
      <input type="hidden" name="service_id" value={serviceId ?? ""} />
      <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />
      <input type="hidden" name="time" value={time ?? ""} />
      <input type="hidden" name="online" value={String(online)} />

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
            defaultValue={state.values.name}
            onChange={() => clearError("name")}
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
            defaultValue={state.values.email}
            onChange={() => clearError("email")}
            aria-invalid={Boolean(errors.email)}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field data-invalid={Boolean(errors.service)}>
          <FieldLabel htmlFor="service">Service</FieldLabel>
          <Select
            items={services.map((service) => ({ value: service.id, label: service.name }))}
            value={serviceId ?? null}
            onValueChange={selectService}
          >
            <SelectTrigger
              id="service"
              className="w-full"
              aria-invalid={Boolean(errors.service)}
            >
              <SelectValue placeholder="Choose a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.service}</FieldError>
        </Field>
        {nutritionist.offersOnline && (
          <Field orientation="horizontal" data-invalid={Boolean(errors.online)}>
            <Checkbox id="online" checked={online} onCheckedChange={selectOnline} />
            <FieldLabel htmlFor="online">Online appointment</FieldLabel>
            <FieldError>{errors.online}</FieldError>
          </Field>
        )}
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
          </Field>
          <Field className="flex-1" data-invalid={Boolean(errors.when)}>
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
            {errors.when ? (
              <FieldError>{errors.when}</FieldError>
            ) : (
              !date && <FieldDescription>Pick a day to see available times.</FieldDescription>
            )}
          </Field>
        </div>
      </FieldSet>

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <RequestAppointmentButton />
      </DialogFooter>
    </form>
  )
}
