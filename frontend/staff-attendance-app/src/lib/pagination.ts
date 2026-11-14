export const PAGE_SIZE = 10;

// Ask the backend for one extra row. If it arrives, a next page exists.
export function pageParams(page: number) {
  return { limit: PAGE_SIZE + 1, offset: page * PAGE_SIZE };
}

// Cut the extra row off before showing the list
export function splitPage<T>(items: T[]) {
  return { rows: items.slice(0, PAGE_SIZE), hasNext: items.length > PAGE_SIZE };
}