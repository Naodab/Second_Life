import { customFetch } from "@workspace/api-client-react";

import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type MessageProductCard = {
  listingId: string;
  listingVariantId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  listingType?: string | null;
  price?: number | null;
};

export type MessageOrderCard = {
  orderId: string;
  orderType?: string | null;
  status?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  amount?: number | null;
};

export type MessageResponse = {
  id: string;
  conversationId: string;
  senderProfileId: string;
  content?: string | null;
  imageUrls?: string[] | null;
  productCard?: MessageProductCard | null;
  orderCard?: MessageOrderCard | null;
  createdAt: string;
};

export type ConversationResponse = {
  id: string;
  buyerProfileId: string;
  sellerProfileId: string;
  facilityId: string;
  facilityName?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MessagePayload = {
  content?: string;
  imageUrls?: string[];
  productCard?: MessageProductCard;
  orderCard?: MessageOrderCard;
};

export type CreateConversationPayload = MessagePayload & {
  facilityId: string;
};

export async function listConversations(
  role: "buyer" | "seller",
  limit = 50,
): Promise<ConversationResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<ConversationResponse[]>>("/api/v1/conversations", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    query: { role, limit },
  });
  const rows = unwrapApiData(raw);
  return Array.isArray(rows) ? rows : [];
}

export async function createConversation(payload: CreateConversationPayload): Promise<ConversationResponse> {
  const raw = await customFetch<ApiResponseEnvelope<ConversationResponse>>("/api/v1/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return unwrapApiData(raw);
}

export async function listConversationMessages(
  conversationId: string,
  limit = 50,
): Promise<MessageResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<MessageResponse[]>>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      query: { limit },
    },
  );
  const rows = unwrapApiData(raw);
  return Array.isArray(rows) ? rows : [];
}

export async function sendConversationMessage(
  conversationId: string,
  payload: MessagePayload,
): Promise<MessageResponse> {
  const raw = await customFetch<ApiResponseEnvelope<MessageResponse>>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return unwrapApiData(raw);
}

export async function markConversationRead(conversationId: string): Promise<ConversationResponse> {
  const raw = await customFetch<ApiResponseEnvelope<ConversationResponse>>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}
