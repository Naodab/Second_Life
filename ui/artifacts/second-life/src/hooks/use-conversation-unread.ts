import { useQuery } from "@tanstack/react-query";

import { listConversations } from "@/api/conversations";
import { useAuth } from "@/context/AuthContext";
import {
  conversationsRoleKey,
  sumConversationUnread,
} from "@/lib/conversations-cache";

export function useConversationUnreadCounts() {
  const { user } = useAuth();
  const profileId = user?.id?.trim() ?? "";
  const enabled = Boolean(profileId);

  const buyerQuery = useQuery({
    queryKey: conversationsRoleKey("buyer"),
    queryFn: () => listConversations("buyer"),
    enabled,
    staleTime: 15_000,
  });

  const sellerQuery = useQuery({
    queryKey: conversationsRoleKey("seller"),
    queryFn: () => listConversations("seller"),
    enabled,
    staleTime: 15_000,
  });

  const adminSupportQuery = useQuery({
    queryKey: conversationsRoleKey("admin-support"),
    queryFn: () => listConversations("admin-support"),
    enabled,
    staleTime: 15_000,
  });

  const buyerUnreadCount = sumConversationUnread(buyerQuery.data);
  const sellerUnreadCount = sumConversationUnread(sellerQuery.data);
  const adminSupportUnreadCount = sumConversationUnread(adminSupportQuery.data);

  return {
    buyerUnreadCount,
    sellerUnreadCount,
    adminSupportUnreadCount,
    totalUnreadCount: buyerUnreadCount + sellerUnreadCount + adminSupportUnreadCount,
    isLoading: buyerQuery.isLoading || sellerQuery.isLoading || adminSupportQuery.isLoading,
  };
}
