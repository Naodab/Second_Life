import type { QueryClient } from "@tanstack/react-query";

import type { ConversationResponse, MessageResponse } from "@/api/conversations";

export const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;

export function conversationMessagesQueryKey(conversationId: string) {
  return ["conversations", conversationId, "messages"] as const;
}

export type ConversationsCacheRole = "buyer" | "seller" | "admin" | "admin-support";

export function conversationsRoleKey(role: ConversationsCacheRole) {
  return [...CONVERSATIONS_QUERY_KEY, role] as const;
}

export function roleForViewer(
  conversation: ConversationResponse,
  profileId: string,
  isAdmin = false,
): ConversationsCacheRole | null {
  const normalized = profileId.trim();
  if (conversation.buyerProfileId === normalized) {
    return conversation.conversationType === "ADMIN" ? "admin-support" : "buyer";
  }
  if (conversation.sellerProfileId === normalized) return "seller";
  if (isAdmin && conversation.conversationType === "ADMIN") return "admin";
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
  role: ConversationsCacheRole,
): string {
  if (role === "admin-support") {
    return conversation.facilityName?.trim() || "Ban quản trị";
  }
  if (role === "buyer") {
    return conversation.facilityName?.trim() || "Tin nhắn từ cơ sở";
  }
  if (role === "admin") {
    return `Người dùng ${conversation.buyerProfileId.slice(0, 8)}`;
  }
  return `Khách ${conversation.buyerProfileId.slice(0, 8)}`;
}

export function applyRealtimeMessage(
  queryClient: QueryClient,
  message: MessageResponse,
  conversation: ConversationResponse,
  profileId: string,
  isAdmin = false,
) {
  const role = roleForViewer(conversation, profileId, isAdmin);
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
