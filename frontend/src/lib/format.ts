const euros = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
})

export const formatEuros = (amount: number) => euros.format(amount)

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
