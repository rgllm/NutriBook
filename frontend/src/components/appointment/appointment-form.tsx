"use client"

import { useEffect, useState } from "react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { enGB, pt } from "react-day-picker/locale"

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
import type { Locale } from "@/i18n/locale"
import {
  bookingDayInstant,
  isSlotInPast,
  practiceToday,
  TIME_SLOTS,
  toBookingDay,
  type AppointmentErrors,
  type AppointmentField,
  type RequestAppointmentState,
  type TimeSlot,
} from "@/lib/appointment-request"

type EditingState = Extract<RequestAppointmentState, { status: "editing" }>

const CALENDAR_LOCALES = { "en-GB": enGB, "pt-PT": pt } satisfies Record<Locale, unknown>

// The control each field's error belongs to, in the order the form shows them,
// so focus lands on the first problem the guest has to fix.
const FOCUS_TARGETS = [
  ["name", "guest-name"],
  ["email", "guest-email"],
  ["service", "service"],
  ["online", "online"],
  ["when", "time-slots"],
] as const satisfies ReadonlyArray<readonly [AppointmentField, string]>

export function AppointmentForm({
  nutritionist,
  state,
  action,
}: {
  nutritionist: Nutritionist
  state: EditingState
  action: (formData: FormData) => void
}) {
  const t = useTranslations("appointment")
  const format = useFormatter()
  const locale = useLocale()
  const { services } = nutritionist
  const serviceItems = services.map((service) => ({
    value: service.id,
    label: t("serviceOption", {
      name: service.name,
      price: service.priceEur,
      minutes: service.durationMinutes,
    }),
  }))
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

  useEffect(() => {
    const target = FOCUS_TARGETS.find(([field]) => state.errors[field])
    if (target) document.getElementById(target[1])?.focus()
  }, [state])

  const clearError = (key: keyof AppointmentErrors) =>
    setErrors((current) => ({ ...current, [key]: undefined }))

  const errorId = (key: AppointmentField) => `${key}-error`
  const describedBy = (key: AppointmentField) => (errors[key] ? errorId(key) : undefined)

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
      <input type="hidden" name="date" value={date ? toBookingDay(date) : ""} />
      <input type="hidden" name="time" value={time ?? ""} />
      <input type="hidden" name="online" value={String(online)} />

      <DialogHeader>
        <DialogTitle className="text-subheading">
          {t("title")}
        </DialogTitle>
        <DialogDescription>
          {t("description", {
            name: nutritionist.name,
            title: nutritionist.title,
            city: nutritionist.city,
          })}
        </DialogDescription>
        <p className="text-sm text-muted-foreground">{t("requiredHint")}</p>
      </DialogHeader>

      <FieldGroup className="sm:flex-row">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="guest-name" required>{t("name")}</FieldLabel>
          <Input
            id="guest-name"
            name="name"
            required
            autoComplete="name"
            defaultValue={state.values.name}
            onChange={() => clearError("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
          />
          <FieldError id={errorId("name")}>{errors.name}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="guest-email" required>{t("email")}</FieldLabel>
          <Input
            id="guest-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            defaultValue={state.values.email}
            onChange={() => clearError("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          <FieldError id={errorId("email")}>{errors.email}</FieldError>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field data-invalid={Boolean(errors.service)}>
          <FieldLabel htmlFor="service" required>{t("service")}</FieldLabel>
          <Select
            items={serviceItems}
            value={serviceId ?? null}
            onValueChange={selectService}
          >
            <SelectTrigger
              id="service"
              className="w-full"
              aria-required
              aria-invalid={Boolean(errors.service)}
              aria-describedby={describedBy("service")}
            >
              <SelectValue placeholder={t("servicePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {serviceItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id={errorId("service")}>{errors.service}</FieldError>
        </Field>
        {nutritionist.offersOnline && (
          <Field orientation="horizontal" data-invalid={Boolean(errors.online)}>
            <Checkbox
              id="online"
              checked={online}
              onCheckedChange={selectOnline}
              aria-invalid={Boolean(errors.online)}
              aria-describedby={describedBy("online")}
            />
            <FieldLabel htmlFor="online">{t("online")}</FieldLabel>
            <FieldError id={errorId("online")}>{errors.online}</FieldError>
          </Field>
        )}
      </FieldGroup>

      <FieldSet>
        <FieldLegend required>{t("dateAndTime")}</FieldLegend>
        <div className="flex flex-col gap-6 sm:flex-row">
          <Field className="sm:w-auto">
            <Calendar
              mode="single"
              locale={CALENDAR_LOCALES[locale]}
              selected={date}
              onSelect={selectDate}
              disabled={[{ before: practiceToday() }, { dayOfWeek: [0] }]}
              className="rounded-lg border p-0 sm:p-2"
            />
          </Field>
          <Field className="flex-1" data-invalid={Boolean(errors.when)}>
            <FieldLabel id="time-label">
              {date ? format.dateTime(bookingDayInstant(date), "appointmentDay") : t("time")}
            </FieldLabel>
            <ToggleGroup
              id="time-slots"
              tabIndex={-1}
              aria-labelledby="time-label"
              aria-describedby={describedBy("when")}
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
              <FieldError id={errorId("when")}>{errors.when}</FieldError>
            ) : (
              !date && <FieldDescription>{t("pickDay")}</FieldDescription>
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
        <DialogClose render={<Button variant="outline" />}>{t("cancel")}</DialogClose>
        <RequestAppointmentButton />
      </DialogFooter>
    </form>
  )
}
