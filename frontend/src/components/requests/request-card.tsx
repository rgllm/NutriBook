import { CalendarIcon, ClockIcon, MailIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AnswerRequestForm } from "@/components/requests/answer-request-form"
import { formatRequestDate, formatRequestTimeRange, initials } from "@/lib/format"
import type { PendingRequest } from "@/lib/pending-requests"

export function RequestCard({ request }: { request: PendingRequest }) {
  const startsAt = new Date(request.startsAt)

  return (
    <Card className="w-full">
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary font-heading text-subheading text-primary-foreground">
              {initials(request.guestName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-subheading">{request.guestName}</h2>
            <p className="text-muted-foreground">{request.serviceName}</p>
          </div>
        </div>

        <dl className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <dt>
              <MailIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">Email</span>
            </dt>
            <dd className="min-w-0 truncate">
              <a
                href={`mailto:${request.guestEmail}`}
                className="underline-offset-4 hover:underline"
              >
                {request.guestEmail}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">Date</span>
            </dt>
            <dd>
              <time dateTime={request.startsAt}>{formatRequestDate(startsAt)}</time>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <ClockIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">Time</span>
            </dt>
            <dd className="tabular-nums">
              {formatRequestTimeRange(startsAt, request.durationMinutes)}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter>
        <AnswerRequestForm requestId={request.id} guestName={request.guestName} />
      </CardFooter>
    </Card>
  )
}
