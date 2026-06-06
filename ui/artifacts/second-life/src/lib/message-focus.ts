let focusedConversationId: string | null = null;

export function setFocusedConversationId(conversationId: string | null) {
  focusedConversationId = conversationId?.trim() || null;
}

export function shouldAlertForIncomingMessage(conversationId: string): boolean {
  return focusedConversationId !== conversationId.trim();
}
