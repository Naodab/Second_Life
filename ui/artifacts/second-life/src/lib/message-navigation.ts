import type { MessageOrderCard, MessageProductCard } from "@/api/conversations";

export type MessageDeepLinkContext = {
  facilityId: string;
  tab?: "facilities" | "customers";
  listingId?: string;
  listingVariantId?: string;
  productTitle?: string;
  thumbnailUrl?: string;
  listingType?: string;
  price?: number;
  orderId?: string;
  orderKind?: "buy" | "rent";
  orderStatus?: string;
  orderTitle?: string;
  orderAmount?: number;
};

const STORAGE_KEY = "secondlife.message-attach-sent";

export function resolveMessageSearch(search: string): string {
  const fromRouter = search?.trim();
  if (fromRouter) return fromRouter;
  if (typeof window !== "undefined") {
    return window.location.search ?? "";
  }
  return "";
}

function attachDedupeKey(context: MessageDeepLinkContext): string | null {
  if (context.orderId && context.orderTitle) {
    return `order:${context.orderId}`;
  }
  if (context.listingId && context.productTitle) {
    return `product:${context.listingId}:${context.listingVariantId ?? ""}`;
  }
  return null;
}

export function wasInitialAttachSent(context: MessageDeepLinkContext): boolean {
  const key = attachDedupeKey(context);
  if (!key) return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const sent = JSON.parse(raw) as string[];
    return Array.isArray(sent) && sent.includes(key);
  } catch {
    return false;
  }
}

export function markInitialAttachSent(context: MessageDeepLinkContext): void {
  const key = attachDedupeKey(context);
  if (!key) return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const sent = raw ? (JSON.parse(raw) as string[]) : [];
    if (!sent.includes(key)) {
      sent.push(key);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sent));
    }
  } catch {
    // ignore storage errors
  }
}

/** @deprecated use wasInitialAttachSent */
export function markDeepLinkHandled(context: MessageDeepLinkContext): boolean {
  return wasInitialAttachSent(context);
}

export function buildMessagesHref(context: MessageDeepLinkContext): string {
  const params = new URLSearchParams();
  params.set("facilityId", context.facilityId.trim());
  if (context.tab === "customers") params.set("tab", "customers");
  if (context.listingId?.trim()) params.set("listingId", context.listingId.trim());
  if (context.listingVariantId?.trim()) params.set("listingVariantId", context.listingVariantId.trim());
  if (context.productTitle?.trim()) params.set("productTitle", context.productTitle.trim());
  if (context.thumbnailUrl?.trim()) params.set("thumbnailUrl", context.thumbnailUrl.trim());
  if (context.listingType?.trim()) params.set("listingType", context.listingType.trim());
  if (context.price != null && Number.isFinite(context.price)) params.set("price", String(context.price));
  if (context.orderId?.trim()) params.set("orderId", context.orderId.trim());
  if (context.orderKind) params.set("orderKind", context.orderKind);
  if (context.orderStatus?.trim()) params.set("orderStatus", context.orderStatus.trim());
  if (context.orderTitle?.trim()) params.set("orderTitle", context.orderTitle.trim());
  if (context.orderAmount != null && Number.isFinite(context.orderAmount)) {
    params.set("orderAmount", String(context.orderAmount));
  }
  return `/messages?${params.toString()}`;
}

export function parseMessageDeepLink(search: string): MessageDeepLinkContext | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const facilityId = params.get("facilityId")?.trim();
  if (!facilityId) return null;

  const priceRaw = params.get("price");
  const orderAmountRaw = params.get("orderAmount");
  const orderKindRaw = params.get("orderKind")?.trim().toLowerCase();

  return {
    facilityId,
    tab: params.get("tab")?.trim() === "customers" ? "customers" : undefined,
    listingId: params.get("listingId")?.trim() || undefined,
    listingVariantId: params.get("listingVariantId")?.trim() || undefined,
    productTitle: params.get("productTitle")?.trim() || undefined,
    thumbnailUrl: params.get("thumbnailUrl")?.trim() || undefined,
    listingType: params.get("listingType")?.trim() || undefined,
    price: priceRaw != null && Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : undefined,
    orderId: params.get("orderId")?.trim() || undefined,
    orderKind: orderKindRaw === "buy" || orderKindRaw === "rent" ? orderKindRaw : undefined,
    orderStatus: params.get("orderStatus")?.trim() || undefined,
    orderTitle: params.get("orderTitle")?.trim() || undefined,
    orderAmount:
      orderAmountRaw != null && Number.isFinite(Number(orderAmountRaw)) ? Number(orderAmountRaw) : undefined,
  };
}

export function buildInitialMessagePayload(context: MessageDeepLinkContext) {
  if (context.orderId && context.orderTitle) {
    return {
      orderCard: {
        orderId: context.orderId,
        orderType: context.orderKind === "rent" ? "RENT" : "BUY",
        status: context.orderStatus ?? undefined,
        title: context.orderTitle,
        thumbnailUrl: context.thumbnailUrl ?? undefined,
        amount: context.orderAmount ?? undefined,
      },
    };
  }
  if (context.listingId && context.productTitle) {
    return {
      productCard: {
        listingId: context.listingId,
        listingVariantId: context.listingVariantId ?? undefined,
        title: context.productTitle,
        thumbnailUrl: context.thumbnailUrl ?? undefined,
        listingType: context.listingType?.toUpperCase() ?? undefined,
        price: context.price ?? undefined,
      },
    };
  }
  return null;
}

export function toProductCardPayload(input: {
  listingId: string;
  listingVariantId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  listingType?: string | null;
  price?: number | null;
}): MessageProductCard {
  return {
    listingId: input.listingId,
    listingVariantId: input.listingVariantId ?? undefined,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl ?? undefined,
    listingType: input.listingType?.toUpperCase() ?? undefined,
    price: input.price ?? undefined,
  };
}

export function toOrderCardPayload(input: {
  orderId: string;
  orderKind: "buy" | "rent";
  status?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  amount?: number | null;
}): MessageOrderCard {
  return {
    orderId: input.orderId,
    orderType: input.orderKind === "rent" ? "RENT" : "BUY",
    status: input.status ?? undefined,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl ?? undefined,
    amount: input.amount ?? undefined,
  };
}
