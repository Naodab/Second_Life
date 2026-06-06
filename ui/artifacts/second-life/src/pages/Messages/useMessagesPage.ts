import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";

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
import { ApiErrorCodes, readApiErrorCode } from "@/lib/api-error";
import {
  CONVERSATIONS_QUERY_KEY,
  conversationMessagesQueryKey,
  conversationsRoleKey,
  sumConversationUnread,
} from "@/lib/conversations-cache";
import { setFocusedConversationId } from "@/lib/message-focus";
import { toast } from "@/hooks/use-toast";
import {
  buildInitialMessagePayload,
  markInitialAttachSent,
  parseMessageDeepLink,
  resolveMessageSearch,
  wasInitialAttachSent,
} from "@/lib/message-navigation";

export type MessagesTab = "facilities" | "customers";

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

function parseConversationId(search: string): string | null {
  const resolvedSearch = resolveMessageSearch(search);
  const params = new URLSearchParams(
    resolvedSearch.startsWith("?") ? resolvedSearch.slice(1) : resolvedSearch,
  );
  return params.get("conversationId")?.trim() || null;
}

export function useMessagesPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const profileId = user?.id?.trim() ?? "";
  const queryClient = useQueryClient();
  const deepLinkInFlightRef = useRef(false);

  const [tab, setTab] = useState<MessagesTab>("facilities");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [focusedConversation, setFocusedConversation] = useState<ConversationResponse | null>(null);

  const role = tab === "facilities" ? "buyer" : "seller";

  const buyerConversationsQuery = useQuery({
    queryKey: conversationsRoleKey("buyer"),
    queryFn: () => listConversations("buyer"),
    enabled: Boolean(profileId),
    staleTime: 15_000,
  });

  const sellerConversationsQuery = useQuery({
    queryKey: conversationsRoleKey("seller"),
    queryFn: () => listConversations("seller"),
    enabled: Boolean(profileId),
    staleTime: 15_000,
  });

  const conversations =
    tab === "facilities" ? (buyerConversationsQuery.data ?? []) : (sellerConversationsQuery.data ?? []);
  const conversationsLoading =
    tab === "facilities" ? buyerConversationsQuery.isLoading : sellerConversationsQuery.isLoading;

  const buyerUnreadCount = sumConversationUnread(buyerConversationsQuery.data);
  const sellerUnreadCount = sumConversationUnread(sellerConversationsQuery.data);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    const buyerRows = buyerConversationsQuery.data ?? [];
    const sellerRows = sellerConversationsQuery.data ?? [];
    return (
      buyerRows.find((item) => item.id === activeConversationId) ??
      sellerRows.find((item) => item.id === activeConversationId) ??
      (focusedConversation?.id === activeConversationId ? focusedConversation : null)
    );
  }, [
    activeConversationId,
    buyerConversationsQuery.data,
    sellerConversationsQuery.data,
    focusedConversation,
  ]);

  const messagesQuery = useQuery({
    queryKey: activeConversationId
      ? conversationMessagesQueryKey(activeConversationId)
      : ["conversations", "none", "messages"],
    queryFn: () => listConversationMessages(activeConversationId!),
    enabled: Boolean(profileId && activeConversationId),
    staleTime: 5_000,
  });

  const openConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      setFocusedConversation(conversation);
      queryClient.setQueryData<ConversationResponse[]>(conversationsRoleKey("buyer"), (prev) => {
        const rows = prev ?? [];
        const without = rows.filter((item) => item.id !== conversation.id);
        return [conversation, ...without];
      });
      setActiveConversationId(conversation.id);
      setTab("facilities");
      void queryClient.invalidateQueries({
        queryKey: conversationMessagesQueryKey(conversation.id),
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: MessagePayload }) =>
      sendConversationMessage(conversationId, payload),
    onSuccess: (message, variables) => {
      queryClient.setQueryData<MessageResponse[]>(
        conversationMessagesQueryKey(variables.conversationId),
        (prev) => [...(prev ?? []), message],
      );
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markConversationRead,
    onSuccess: (conversation) => {
      const updateRole = profileId === conversation.buyerProfileId ? "buyer" : "seller";
      queryClient.setQueryData<ConversationResponse[]>(conversationsRoleKey(updateRole), (prev) =>
        (prev ?? []).map((item) => (item.id === conversation.id ? conversation : item)),
      );
    },
  });

  const markedReadRef = useRef<string | null>(null);

  useEffect(() => {
    setFocusedConversationId(activeConversationId);
    return () => setFocusedConversationId(null);
  }, [activeConversationId]);

  useEffect(() => {
    const resolvedSearch = resolveMessageSearch(search);
    const params = new URLSearchParams(
      resolvedSearch.startsWith("?") ? resolvedSearch.slice(1) : resolvedSearch,
    );
    if (params.get("tab")?.trim() === "customers") {
      setTab("customers");
    }
    const conversationId = parseConversationId(search);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [search]);

  useEffect(() => {
    markedReadRef.current = null;
  }, [activeConversationId, activeConversation?.unreadCount]);

  useEffect(() => {
    if (!activeConversationId || !profileId) return;
    const buyerRows = buyerConversationsQuery.data ?? [];
    const sellerRows = sellerConversationsQuery.data ?? [];
    const conversation =
      buyerRows.find((item) => item.id === activeConversationId) ??
      sellerRows.find((item) => item.id === activeConversationId) ??
      (focusedConversation?.id === activeConversationId ? focusedConversation : null);
    if (!conversation || conversation.unreadCount <= 0) return;
    if (markedReadRef.current === activeConversationId) return;
    markedReadRef.current = activeConversationId;
    markReadMutation.mutate(activeConversationId);
  }, [
    activeConversationId,
    buyerConversationsQuery.data,
    sellerConversationsQuery.data,
    focusedConversation,
    profileId,
  ]);

  useEffect(() => {
    const resolvedSearch = resolveMessageSearch(search);
    const context = parseMessageDeepLink(resolvedSearch);
    if (!context?.facilityId || !profileId || deepLinkInFlightRef.current) return;

    if (context.tab === "customers") {
      setTab("customers");
      setLocation("/messages?tab=customers", { replace: true });
      return;
    }

    const run = async () => {
      deepLinkInFlightRef.current = true;
      const initialPayload = buildInitialMessagePayload(context);
      const skipAttach = initialPayload ? wasInitialAttachSent(context) : true;

      try {
        await openConversationMutation.mutateAsync({
          facilityId: context.facilityId,
          ...(initialPayload && !skipAttach ? initialPayload : {}),
        });
        if (initialPayload && !skipAttach) {
          markInitialAttachSent(context);
        }
        setLocation("/messages", { replace: true });
      } catch (err) {
        if (readApiErrorCode(err) === ApiErrorCodes.CANNOT_MESSAGE_OWN_FACILITY) {
          toast({
            title: "Không thể nhắn tin với cơ sở của bạn",
            description: "Xem tin nhắn từ khách hàng ở tab Với khách.",
          });
          setTab("customers");
          setLocation("/messages?tab=customers", { replace: true });
        }
      } finally {
        deepLinkInFlightRef.current = false;
      }
    };

    void run();
  }, [search, profileId]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    if (!conversationId) {
      setFocusedConversation(null);
    }
  }, []);

  const changeTab = useCallback((nextTab: MessagesTab) => {
    setTab(nextTab);
    setActiveConversationId(null);
    setFocusedConversation(null);
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
    conversationsLoading,
    buyerUnreadCount,
    sellerUnreadCount,
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
