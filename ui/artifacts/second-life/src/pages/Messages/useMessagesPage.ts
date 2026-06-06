import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";

import {
  createConversation,
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
  type ConversationResponse,
  type MessagePayload,
  type MessageResponse,
} from "@/api/conversations";
import { useAuth } from "@/context/AuthContext";
import {
  buildInitialMessagePayload,
  markDeepLinkHandled,
  parseMessageDeepLink,
} from "@/lib/message-navigation";

export type MessagesTab = "facilities" | "customers";

const CONVERSATIONS_KEY = ["conversations"] as const;

function conversationMessagesKey(conversationId: string) {
  return ["conversations", conversationId, "messages"] as const;
}

function formatConversationTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("vi", { day: "2-digit", month: "2-digit" });
}

export function useMessagesPage() {
  const search = useSearch();
  const { user } = useAuth();
  const profileId = user?.id?.trim() ?? "";
  const queryClient = useQueryClient();
  const deepLinkHandledRef = useRef(false);

  const [tab, setTab] = useState<MessagesTab>("facilities");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const role = tab === "facilities" ? "buyer" : "seller";

  const conversationsQuery = useQuery({
    queryKey: [...CONVERSATIONS_KEY, role],
    queryFn: () => listConversations(role),
    enabled: Boolean(profileId),
    staleTime: 15_000,
  });

  const conversations = conversationsQuery.data ?? [];
  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const messagesQuery = useQuery({
    queryKey: activeConversationId
      ? conversationMessagesKey(activeConversationId)
      : ["conversations", "none", "messages"],
    queryFn: () => listConversationMessages(activeConversationId!),
    enabled: Boolean(profileId && activeConversationId),
    staleTime: 5_000,
  });

  const openConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationResponse[]>([...CONVERSATIONS_KEY, "buyer"], (prev) => {
        const rows = prev ?? [];
        const without = rows.filter((item) => item.id !== conversation.id);
        return [conversation, ...without];
      });
      setActiveConversationId(conversation.id);
      setTab("facilities");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: MessagePayload }) =>
      sendConversationMessage(conversationId, payload),
    onSuccess: (message, variables) => {
      queryClient.setQueryData<MessageResponse[]>(
        conversationMessagesKey(variables.conversationId),
        (prev) => [...(prev ?? []), message],
      );
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markConversationRead,
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationResponse[]>([...CONVERSATIONS_KEY, role], (prev) =>
        (prev ?? []).map((item) => (item.id === conversation.id ? conversation : item)),
      );
    },
  });

  const markedReadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeConversationId || !profileId) return;
    const conversation = conversations.find((item) => item.id === activeConversationId);
    if (!conversation || conversation.unreadCount <= 0) return;
    if (markedReadRef.current === activeConversationId) return;
    markedReadRef.current = activeConversationId;
    markReadMutation.mutate(activeConversationId);
  }, [activeConversationId, conversations, profileId]);

  useEffect(() => {
    const context = parseMessageDeepLink(search);
    if (!context || !profileId || deepLinkHandledRef.current) return;
    if (markDeepLinkHandled(context)) {
      deepLinkHandledRef.current = true;
      return;
    }
    deepLinkHandledRef.current = true;
    const initialPayload = buildInitialMessagePayload(context);
    void openConversationMutation.mutateAsync({
      facilityId: context.facilityId,
      ...initialPayload,
    });
  }, [search, profileId]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
  }, []);

  const changeTab = useCallback((nextTab: MessagesTab) => {
    setTab(nextTab);
    setActiveConversationId(null);
  }, []);

  const sendMessage = useCallback(
    async (payload: MessagePayload) => {
      if (!activeConversationId) return;
      await sendMessageMutation.mutateAsync({ conversationId: activeConversationId, payload });
    },
    [activeConversationId, sendMessageMutation],
  );

  const isMine = useCallback(
    (senderProfileId: string) => senderProfileId === profileId,
    [profileId],
  );

  return {
    tab,
    changeTab,
    conversations,
    conversationsLoading: conversationsQuery.isLoading,
    activeConversation,
    activeConversationId,
    selectConversation,
    messages: messagesQuery.data ?? [],
    messagesLoading: messagesQuery.isLoading,
    sendMessage,
    sending: sendMessageMutation.isPending,
    openingConversation: openConversationMutation.isPending,
    profileId,
    isMine,
    formatConversationTime,
  };
}
