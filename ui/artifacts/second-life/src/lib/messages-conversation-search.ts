import type { ConversationResponse } from "@/api/conversations";

export type MessagesConversationTab = "facilities" | "customers";

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
  if (tab === "customers") {
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
  return tab === "facilities"
    ? "Tìm cơ sở hoặc tin nhắn..."
    : "Tìm khách, cơ sở hoặc tin nhắn...";
}
