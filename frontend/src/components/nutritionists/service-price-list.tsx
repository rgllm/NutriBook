import { formatEuros } from "@/lib/format"
import type { Service } from "@/lib/nutritionists"

export function ServicePriceList({ services }: { services: Service[] }) {
  return (
    <ul className="flex max-w-80 flex-col divide-y divide-border">
      {services.map((service) => (
        <li
          key={service.name}
          className="flex items-baseline justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
        >
          <span>{service.name}</span>
          <span className="font-medium tabular-nums">{formatEuros(service.priceEur)}</span>
        </li>
      ))}
    </ul>
  )
}
