import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";

import {
  createConversation,
  getOrCreateAdminSupportConversation,
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
import { filterConversationsBySearch, type MessagesConversationTab } from "@/lib/messages-conversation-search";

export type MessagesPageMode = "default" | "admin";

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

function parseTabFromSearch(search: string): MessagesConversationTab | null {
  const resolvedSearch = resolveMessageSearch(search);
  const params = new URLSearchParams(
    resolvedSearch.startsWith("?") ? resolvedSearch.slice(1) : resolvedSearch,
  );
  const tab = params.get("tab")?.trim();
  if (tab === "customers" || tab === "admin" || tab === "facilities") {
    return tab;
  }
  return null;
}

export function useMessagesPage(options: { mode?: MessagesPageMode } = {}) {
  const mode = options.mode ?? "default";
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const profileId = user?.id?.trim() ?? "";
  const queryClient = useQueryClient();
  const deepLinkInFlightRef = useRef(false);
  const adminBootstrapRef = useRef(false);

  const [tab, setTab] = useState<MessagesConversationTab>(
    mode === "admin" ? "admin" : "facilities",
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [focusedConversation, setFocusedConversation] = useState<ConversationResponse | null>(null);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  const buyerConversationsQuery = useQuery({
    queryKey: conversationsRoleKey("buyer"),
    queryFn: () => listConversations("buyer"),
    enabled: Boolean(profileId) && mode === "default",
    staleTime: 15_000,
  });

  const sellerConversationsQuery = useQuery({
    queryKey: conversationsRoleKey("seller"),
    queryFn: () => listConversations("seller"),
    enabled: Boolean(profileId) && mode === "default",
    staleTime: 15_000,
  });

  const adminSupportQuery = useQuery({
    queryKey: conversationsRoleKey("admin-support"),
    queryFn: () => listConversations("admin-support"),
    enabled: Boolean(profileId) && mode === "default",
    staleTime: 15_000,
  });

  const adminInboxQuery = useQuery({
    queryKey: conversationsRoleKey("admin"),
    queryFn: () => listConversations("admin"),
    enabled: Boolean(profileId) && mode === "admin",
    staleTime: 15_000,
  });

  const conversations = useMemo(() => {
    if (mode === "admin") return adminInboxQuery.data ?? [];
    if (tab === "facilities") return buyerConversationsQuery.data ?? [];
    if (tab === "customers") return sellerConversationsQuery.data ?? [];
    return adminSupportQuery.data ?? [];
  }, [
    mode,
    tab,
    adminInboxQuery.data,
    buyerConversationsQuery.data,
    sellerConversationsQuery.data,
    adminSupportQuery.data,
  ]);

  const searchQuery =
    mode === "admin" || tab === "admin"
      ? adminSearchQuery
      : tab === "facilities"
        ? facilitySearchQuery
        : customerSearchQuery;

  const setSearchQuery =
    mode === "admin" || tab === "admin"
      ? setAdminSearchQuery
      : tab === "facilities"
        ? setFacilitySearchQuery
        : setCustomerSearchQuery;

  const filteredConversations = useMemo(
    () => filterConversationsBySearch(conversations, mode === "admin" ? "admin" : tab, searchQuery),
    [conversations, mode, tab, searchQuery],
  );

  const hasAnyConversations = conversations.length > 0;
  const conversationsLoading =
    mode === "admin"
      ? adminInboxQuery.isLoading
      : tab === "facilities"
        ? buyerConversationsQuery.isLoading
        : tab === "customers"
          ? sellerConversationsQuery.isLoading
          : adminSupportQuery.isLoading;

  const buyerUnreadCount = sumConversationUnread(buyerConversationsQuery.data);
  const sellerUnreadCount = sumConversationUnread(sellerConversationsQuery.data);
  const adminSupportUnreadCount = sumConversationUnread(adminSupportQuery.data);
  const adminInboxUnreadCount = sumConversationUnread(adminInboxQuery.data);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    const pools = [
      buyerConversationsQuery.data ?? [],
      sellerConversationsQuery.data ?? [],
      adminSupportQuery.data ?? [],
      adminInboxQuery.data ?? [],
    ];
    for (const rows of pools) {
      const found = rows.find((item) => item.id === activeConversationId);
      if (found) return found;
    }
    return focusedConversation?.id === activeConversationId ? focusedConversation : null;
  }, [
    activeConversationId,
    buyerConversationsQuery.data,
    sellerConversationsQuery.data,
    adminSupportQuery.data,
    adminInboxQuery.data,
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

  const openAdminSupportMutation = useMutation({
    mutationFn: getOrCreateAdminSupportConversation,
    onSuccess: (conversation) => {
      setFocusedConversation(conversation);
      queryClient.setQueryData<ConversationResponse[]>(conversationsRoleKey("admin-support"), () => [
        conversation,
      ]);
      setActiveConversationId(conversation.id);
      setTab("admin");
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
      const updateKey =
        mode === "admin" || conversation.conversationType === "ADMIN"
          ? mode === "admin"
            ? conversationsRoleKey("admin")
            : conversationsRoleKey("admin-support")
          : profileId === conversation.buyerProfileId
            ? conversationsRoleKey("buyer")
            : conversationsRoleKey("seller");
      queryClient.setQueryData<ConversationResponse[]>(updateKey, (prev) =>
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
    if (mode === "admin") return;
    const parsedTab = parseTabFromSearch(search);
    if (parsedTab) {
      setTab(parsedTab);
    }
    const conversationId = parseConversationId(search);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [search, mode]);

  useEffect(() => {
    if (mode !== "admin") return;
    const conversationId = parseConversationId(search);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [search, mode]);

  useEffect(() => {
    markedReadRef.current = null;
  }, [activeConversationId, activeConversation?.unreadCount]);

  useEffect(() => {
    if (!activeConversationId || !profileId) return;
    const conversation = activeConversation;
    if (!conversation || conversation.unreadCount <= 0) return;
    if (markedReadRef.current === activeConversationId) return;
    markedReadRef.current = activeConversationId;
    markReadMutation.mutate(activeConversationId);
  }, [activeConversationId, activeConversation, profileId]);

  useEffect(() => {
    if (mode !== "default" || tab !== "admin" || adminBootstrapRef.current) return;
    if (!profileId || adminSupportQuery.isLoading || openAdminSupportMutation.isPending) return;
    if ((adminSupportQuery.data ?? []).length > 0) return;
    adminBootstrapRef.current = true;
    void openAdminSupportMutation.mutateAsync({});
  }, [
    mode,
    tab,
    profileId,
    adminSupportQuery.isLoading,
    adminSupportQuery.data,
    openAdminSupportMutation,
  ]);

  useEffect(() => {
    const resolvedSearch = resolveMessageSearch(search);
    const context = parseMessageDeepLink(resolvedSearch);
    if (!context?.facilityId || !profileId || deepLinkInFlightRef.current || mode === "admin") return;

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
  }, [search, profileId, mode]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    if (!conversationId) {
      setFocusedConversation(null);
    }
  }, []);

  const changeTab = useCallback(
    (nextTab: MessagesConversationTab) => {
      if (mode === "admin") return;
      setTab(nextTab);
      setActiveConversationId(null);
      setFocusedConversation(null);
    },
    [mode],
  );

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
    mode,
    tab,
    changeTab,
    conversations: filteredConversations,
    conversationsLoading,
    searchQuery,
    setSearchQuery,
    hasConversationSearch: searchQuery.trim().length > 0,
    hasAnyConversations,
    buyerUnreadCount,
    sellerUnreadCount,
    adminSupportUnreadCount,
    adminInboxUnreadCount,
    activeConversation,
    activeConversationId,
    selectConversation,
    messages: messagesQuery.data ?? [],
    messagesLoading: messagesQuery.isLoading,
    sendMessage,
    sending: sendMessageMutation.isPending,
    openingConversation: openConversationMutation.isPending || openAdminSupportMutation.isPending,
    profileId,
    isMine,
    formatConversationTime,
  };
}
