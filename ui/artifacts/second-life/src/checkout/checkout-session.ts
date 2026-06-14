
export type CheckoutLineInput = {
  listingId: string;
  listingVariantId: string;
  quantity: number;
  mode: "buy" | "rent";
  rentalStart?: string;
  rentalEnd?: string;
  rentUnit?: "HOUR" | "DAY" | "WEEK" | "MONTH";
  cartItemId?: string;
};

let pendingLine: CheckoutLineInput | null = null;
let pendingLines: CheckoutLineInput[] = [];

export function setPendingCheckoutLine(line: CheckoutLineInput) {
  pendingLine = line;
  pendingLines = [line];
}

export function getPendingCheckoutLine(): CheckoutLineInput | null {
  return pendingLine;
}

export function setPendingCheckoutLines(lines: CheckoutLineInput[]) {
  pendingLines = lines;
  pendingLine = lines.length === 1 ? lines[0] : null;
}

export function getPendingCheckoutLines(): CheckoutLineInput[] {
  return pendingLines;
}

export function clearPendingCheckoutLine() {
  pendingLine = null;
  pendingLines = [];
}

export function isCartCheckoutSearch(search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw.trim()) return false;
  return new URLSearchParams(raw).get("from") === "cart";
}

export function buildCheckoutCartHref(): string {
  return "/checkout?from=cart";
}

export function resolveCheckoutInputs(search: string): CheckoutLineInput[] {
  if (isCartCheckoutSearch(search)) {
    return getPendingCheckoutLines();
  }
  const fromUrl = parseCheckoutSearch(search);
  if (fromUrl) return [fromUrl];
  if (pendingLines.length > 0) return pendingLines;
  if (pendingLine) return [pendingLine];
  return [];
}

export function parseCheckoutSearch(search: string): CheckoutLineInput | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw.trim()) return null;

  const q = new URLSearchParams(raw);
  if (q.get("from") === "cart") return null;

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
    const ru = q.get("rentUnit")?.trim().toUpperCase();
    if (ru === "HOUR" || ru === "DAY" || ru === "WEEK" || ru === "MONTH") {
      line.rentUnit = ru;
    }
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
    if (line.rentUnit) q.set("rentUnit", line.rentUnit);
  }
  return `/checkout?${q.toString()}`;
}
