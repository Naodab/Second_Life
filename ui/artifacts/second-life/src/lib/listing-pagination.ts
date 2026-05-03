export type PaginationPageSlot =
  | { type: "page"; index: number }
  | { type: "ellipsis"; key: string };

export function buildPaginationPageSlots(
  currentPage: number,
  totalPages: number,
): PaginationPageSlot[] {
  const cap = Math.max(1, totalPages);
  const cur = Math.min(Math.max(0, currentPage), cap - 1);
  if (cap <= 1) {
    return [{ type: "page", index: 0 }];
  }

  let raw: number[];
  if (cap <= 9) {
    raw = Array.from({ length: cap }, (_, i) => i);
  } else {
    const pages = new Set<number>([0, cap - 1]);
    for (let d = -2; d <= 2; d++) {
      const p = cur + d;
      if (p >= 0 && p < cap) {
        pages.add(p);
      }
    }
    raw = [...pages].sort((a, b) => a - b);
  }

  const slots: PaginationPageSlot[] = [];
  let prev = -2;
  for (const p of raw) {
    if (p - prev > 1) {
      slots.push({ type: "ellipsis", key: `${prev}-${p}` });
    }
    slots.push({ type: "page", index: p });
    prev = p;
  }
  return slots;
}
