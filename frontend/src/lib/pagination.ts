export const PAGE_SIZE = 5

export function paginate<T>(items: T[], requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  return {
    page,
    pageCount,
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  }
}
