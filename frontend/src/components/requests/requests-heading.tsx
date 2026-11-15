export function RequestsHeading({ nutritionistName }: { nutritionistName: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-heading text-balance">Pending requests</h1>
      <p className="text-muted-foreground">
        Requests sent to {nutritionistName}. Accept or reject each one.
      </p>
    </div>
  )
}
