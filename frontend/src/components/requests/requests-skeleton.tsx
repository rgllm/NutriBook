import { Skeleton } from "@/components/ui/skeleton"

export function RequestsSkeleton() {
  return (
    <div aria-busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-60 w-full rounded-2xl" />
      ))}
    </div>
  )
}
