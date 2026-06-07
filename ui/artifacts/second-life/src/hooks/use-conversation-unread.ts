import { useQuery } from "@tanstack/react-query";

import { listConversations } from "@/api/conversations";
import { useAuth } from "@/context/AuthContext";
import {
  conversationsRoleKey,
  sumConversationUnread,
} from "@/lib/conversations-cache";

export function useConversationUnreadCounts() {
  const { user, isAdmin } = useAuth();
  const profileId = user?.id?.trim() ?? "";
  /** Regular users only — admin must use role=admin inbox, not buyer/seller/admin-support. */
  const userMessagingEnabled = Boolean(profileId) && !isAdmin;

  const adminInboxQuery = useQuery({
    queryKey: conversationsRoleKey("admin"),
    queryFn: () => listConversations("admin"),
    enabled: isAdmin,
    staleTime: 15_000,
  });

  const buyerQuery = useQuery({
    queryKey: conversationsRoleKey("buyer"),
    queryFn: () => listConversations("buyer"),
    enabled: userMessagingEnabled,
    staleTime: 15_000,
  });

  const sellerQuery = useQuery({
    queryKey: conversationsRoleKey("seller"),
    queryFn: () => listConversations("seller"),
    enabled: userMessagingEnabled,
    staleTime: 15_000,
  });

  const adminSupportQuery = useQuery({
    queryKey: conversationsRoleKey("admin-support"),
    queryFn: () => listConversations("admin-support"),
    enabled: userMessagingEnabled,
    staleTime: 15_000,
  });

  const buyerUnreadCount = sumConversationUnread(buyerQuery.data);
  const sellerUnreadCount = sumConversationUnread(sellerQuery.data);
  const adminSupportUnreadCount = sumConversationUnread(adminSupportQuery.data);
  const adminInboxUnreadCount = sumConversationUnread(adminInboxQuery.data);

  return {
    buyerUnreadCount,
    sellerUnreadCount,
    adminSupportUnreadCount,
    adminInboxUnreadCount,
    totalUnreadCount:
      buyerUnreadCount + sellerUnreadCount + adminSupportUnreadCount + adminInboxUnreadCount,
    isLoading:
      buyerQuery.isLoading ||
      sellerQuery.isLoading ||
      adminSupportQuery.isLoading ||
      adminInboxQuery.isLoading,
  };
}
