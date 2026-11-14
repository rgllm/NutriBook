export function ResultsHeading({
  count,
  city,
  query,
}: {
  count: number
  city: string
  query: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-heading text-balance">
        {count === 1 ? "1 nutritionist" : `${count} nutritionists`} in {city}
      </h1>
      {query && <p className="text-muted-foreground">Matching &ldquo;{query}&rdquo;</p>}
    </div>
  )
}
