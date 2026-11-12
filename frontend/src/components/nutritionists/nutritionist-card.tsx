import { StarIcon, UserRoundIcon, VideoIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScheduleAppointmentDialog } from "@/components/appointment/schedule-appointment-dialog"
import { CardSection } from "@/components/nutritionists/card-section"
import { NutritionistLocation } from "@/components/nutritionists/nutritionist-location"
import { ServicePriceList } from "@/components/nutritionists/service-price-list"
import { initials } from "@/lib/format"
import type { Nutritionist } from "@/lib/nutritionists"

export function NutritionistCard({ nutritionist }: { nutritionist: Nutritionist }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary font-heading text-subheading text-primary-foreground">
            {initials(nutritionist.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col items-start gap-1">
            {nutritionist.offersOnline && (
              <Badge variant="brand" className="mb-1 tracking-wide uppercase">
                <VideoIcon aria-hidden />
                Online
              </Badge>
            )}
            <h2 className="font-heading text-subheading">{nutritionist.name}</h2>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
              <span>{nutritionist.title}</span>
              <span aria-hidden>•</span>
              <span>{nutritionist.licenseNumber}</span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <StarIcon aria-hidden className="size-3.5 fill-foreground text-foreground" />
                <span className="font-medium text-foreground">
                  {nutritionist.rating.toFixed(1)}
                </span>
                ({nutritionist.reviewCount} reviews)
              </span>
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <CardSection title="Location">
              <NutritionistLocation address={nutritionist.address} city={nutritionist.city} />
            </CardSection>
            <CardSection title="Services">
              <ServicePriceList services={nutritionist.services} />
            </CardSection>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:w-52 sm:self-center">
          <ScheduleAppointmentDialog nutritionist={nutritionist} />
          <Button variant="outline" className="w-full">
            <UserRoundIcon data-icon="inline-start" />
            Personal page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
