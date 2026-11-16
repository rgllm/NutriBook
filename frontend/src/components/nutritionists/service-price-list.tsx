import { useFormatter } from "next-intl"

import type { Service } from "@/lib/api/nutritionists"

export function ServicePriceList({ services }: { services: Service[] }) {
  const format = useFormatter()

  return (
    <ul className="flex max-w-80 flex-col divide-y divide-border">
      {services.map((service) => (
        <li
          key={service.id}
          className="flex items-baseline justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
        >
          <span>{service.name}</span>
          <span className="font-medium tabular-nums">{format.number(service.priceEur, "price")}</span>
        </li>
      ))}
    </ul>
  )
}
