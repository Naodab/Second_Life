import type { QueryClient } from "@tanstack/react-query";

import type { ConversationResponse, MessageResponse } from "@/api/conversations";

export const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;

export function conversationMessagesQueryKey(conversationId: string) {
  return ["conversations", conversationId, "messages"] as const;
}

export function conversationsRoleKey(role: "buyer" | "seller") {
  return [...CONVERSATIONS_QUERY_KEY, role] as const;
}

export function roleForViewer(
  conversation: ConversationResponse,
  profileId: string,
): "buyer" | "seller" | null {
  const normalized = profileId.trim();
  if (conversation.buyerProfileId === normalized) return "buyer";
  if (conversation.sellerProfileId === normalized) return "seller";
  return null;
}

export function sumConversationUnread(rows: ConversationResponse[] | undefined): number {
  return (rows ?? []).reduce((total, row) => total + Math.max(0, row.unreadCount ?? 0), 0);
}

export function mergeConversationRow(
  existing: ConversationResponse[],
  conversation: ConversationResponse,
): ConversationResponse[] {
  const without = existing.filter((item) => item.id !== conversation.id);
  return [conversation, ...without];
}

export function messagePreview(message: MessageResponse): string {
  const text = message.content?.trim();
  if (text) return text;
  if (message.productCard?.title) return `[Sản phẩm] ${message.productCard.title}`;
  if (message.orderCard?.title) return `[Đơn hàng] ${message.orderCard.title}`;
  if (message.imageUrls?.length) return "Đã gửi một hình ảnh";
  return "Tin nhắn mới";
}

export function conversationAlertTitle(
  conversation: ConversationResponse,
  role: "buyer" | "seller",
): string {
  if (role === "buyer") {
    return conversation.facilityName?.trim() || "Tin nhắn từ cơ sở";
  }
  return `Khách ${conversation.buyerProfileId.slice(0, 8)}`;
}

export function applyRealtimeMessage(
  queryClient: QueryClient,
  message: MessageResponse,
  conversation: ConversationResponse,
  profileId: string,
) {
  const role = roleForViewer(conversation, profileId);
  if (!role) return;

  queryClient.setQueryData<ConversationResponse[]>(conversationsRoleKey(role), (prev) =>
    mergeConversationRow(prev ?? [], conversation),
  );

  queryClient.setQueryData<MessageResponse[]>(
    conversationMessagesQueryKey(conversation.id),
    (prev) => {
      if (!prev) return prev;
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    },
  );
}
