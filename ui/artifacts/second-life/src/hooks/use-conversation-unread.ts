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

  const buyerUnreadCount = sumConversationUnread(buyerQuery.data);
  const sellerUnreadCount = sumConversationUnread(sellerQuery.data);

  return {
    buyerUnreadCount,
    sellerUnreadCount,
    totalUnreadCount: buyerUnreadCount + sellerUnreadCount,
    isLoading: buyerQuery.isLoading || sellerQuery.isLoading,
  };
}
