import type { ConversationResponse } from "@/api/conversations";

export type MessagesConversationTab = "facilities" | "customers" | "admin";

function normalizeSearchText(raw: string): string {
  return raw.trim().toLowerCase();
}

function conversationSearchHaystack(
  conversation: ConversationResponse,
  tab: MessagesConversationTab,
): string {
  const parts: Array<string | null | undefined> = [
    conversation.facilityName,
    conversation.lastMessagePreview,
  ];
  if (tab === "customers" || tab === "admin") {
    parts.push(conversation.buyerProfileId);
  }
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterConversationsBySearch(
  conversations: ConversationResponse[],
  tab: MessagesConversationTab,
  query: string,
): ConversationResponse[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return conversations;
  }
  return conversations.filter((conversation) =>
    conversationSearchHaystack(conversation, tab).includes(normalizedQuery),
  );
}

export function messagesSearchPlaceholder(tab: MessagesConversationTab): string {
  if (tab === "facilities") return "Tìm cơ sở hoặc tin nhắn...";
  if (tab === "admin") return "Tìm tin nhắn...";
  return "Tìm khách, cơ sở hoặc tin nhắn...";
}
