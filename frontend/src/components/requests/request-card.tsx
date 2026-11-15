import { CalendarIcon, ClockIcon, MailIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"
import { AnswerRequestForm } from "@/components/requests/answer-request-form"
import { formatRequestDate, formatRequestTimeRange, initials } from "@/lib/format"
import type { PendingRequest } from "@/lib/api/appointment-requests"

export function RequestCard({
  nutritionistId,
  request,
}: {
  nutritionistId: string
  request: PendingRequest
}) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-brand-soft font-heading text-subheading text-brand-ink">
              {initials(request.guestName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-subheading">{request.guestName}</h2>
            <p className="text-muted-foreground">{request.serviceName}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="brand">{request.online ? "Online" : "In person"}</Badge>
          {request.overdue && <Badge variant="destructive">Overdue</Badge>}
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
              <time dateTime={request.startsAt.toISOString()}>
                {formatRequestDate(request.startsAt)}
              </time>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <ClockIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">Time</span>
            </dt>
            <dd className="tabular-nums">
              {formatRequestTimeRange(request.startsAt, request.endsAt)}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter>
        <AnswerRequestForm
          action={answerRequest.bind(null, nutritionistId, request.id)}
          guestName={request.guestName}
        />
      </CardFooter>
    </Card>
  )
}
