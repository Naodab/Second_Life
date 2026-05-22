/** Tham số checkout từ modal Mua / Thuê (hoặc query URL). */
export type CheckoutLineInput = {
  listingId: string;
  listingVariantId: string;
  quantity: number;
  mode: "buy" | "rent";
  rentalStart?: string;
  rentalEnd?: string;
};

let pendingLine: CheckoutLineInput | null = null;

export function setPendingCheckoutLine(line: CheckoutLineInput) {
  pendingLine = line;
}

export function getPendingCheckoutLine(): CheckoutLineInput | null {
  return pendingLine;
}

export function clearPendingCheckoutLine() {
  pendingLine = null;
}

export function parseCheckoutSearch(search: string): CheckoutLineInput | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw.trim()) return null;

  const q = new URLSearchParams(raw);
  const listingId = q.get("listingId")?.trim() ?? "";
  const listingVariantId = q.get("listingVariantId")?.trim() ?? "";
  const mode = q.get("mode")?.trim();
  const quantity = Number(q.get("quantity"));

  if (!listingId || !listingVariantId || !Number.isFinite(quantity) || quantity < 1) {
    return null;
  }
  if (mode !== "buy" && mode !== "rent") return null;

  const line: CheckoutLineInput = {
    listingId,
    listingVariantId,
    quantity: Math.floor(quantity),
    mode,
  };

  if (mode === "rent") {
    const rentalStart = q.get("rentalStart")?.trim();
    const rentalEnd = q.get("rentalEnd")?.trim();
    if (!rentalStart || !rentalEnd) return null;
    line.rentalStart = rentalStart;
    line.rentalEnd = rentalEnd;
  }

  return line;
}

export function buildCheckoutHref(line: CheckoutLineInput): string {
  const q = new URLSearchParams({
    listingId: line.listingId,
    listingVariantId: line.listingVariantId,
    quantity: String(line.quantity),
    mode: line.mode,
  });
  if (line.mode === "rent" && line.rentalStart && line.rentalEnd) {
    q.set("rentalStart", line.rentalStart);
    q.set("rentalEnd", line.rentalEnd);
  }
  return `/checkout?${q.toString()}`;
}
