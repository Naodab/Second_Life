import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

import {
  fetchUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resolveNotificationWebSocketUrl,
  type NotificationResponse,
} from "@/api/notifications";
import { toast } from "@/hooks/use-toast";
import { openNotificationLink } from "@/lib/notification-navigation";
import { useAuth } from "@/context/AuthContext";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

export type UiNotification = {
  id: string;
  type: "order" | "payment" | "message" | "system" | "delivery";
  title: string;
  body: string;
  time: Date;
  read: boolean;
  link?: string;
};

function mapNotificationType(type: NotificationResponse["type"]): UiNotification["type"] {
  switch (type) {
    case "DELIVERY":
      return "delivery";
    case "SYSTEM":
      return "system";
    case "ORDER":
    default:
      return "order";
  }
}

function toUiNotification(row: NotificationResponse): UiNotification {
  return {
    id: row.id,
    type: mapNotificationType(row.type),
    title: row.title,
    body: row.body,
    time: new Date(row.createdAt),
    read: row.read,
    link: row.link ?? undefined,
  };
}

function sortNotifications(rows: UiNotification[]): UiNotification[] {
  return [...rows].sort((a, b) => b.time.getTime() - a.time.getTime());
}

function mergeNotification(existing: UiNotification[], incoming: UiNotification): UiNotification[] {
  const withoutDuplicate = existing.filter((item) => item.id !== incoming.id);
  return sortNotifications([incoming, ...withoutDuplicate]);
}

function showNotificationAlert(
  ui: UiNotification,
  navigate: (path: string) => void,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const hasLink = Boolean(ui.link);
  toast({
    title: ui.title,
    description: ui.body,
    duration: 8_000,
    className: hasLink ? "cursor-pointer" : undefined,
    onClick: hasLink
      ? () => {
          openNotificationLink(ui, navigate, queryClient);
        }
      : undefined,
  });
}

function applyRealtimeNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: NotificationResponse,
  showAlert: boolean,
  navigate?: (path: string) => void,
) {
  const ui = toUiNotification(payload);
  queryClient.setQueryData<UiNotification[]>(NOTIFICATIONS_KEY, (prev) =>
    mergeNotification(prev ?? [], ui),
  );
  if (!ui.read) {
    queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (prev) => (prev ?? 0) + 1);
    if (showAlert && navigate) {
      showNotificationAlert(ui, navigate, queryClient);
    }
  }
}

/** Mount once at app root so WebSocket + toast work on every page (including seller hub). */
export function useNotificationRealtimeSync(navigate: (path: string) => void) {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      return;
    }

    const socket = new WebSocket(resolveNotificationWebSocketUrl(accessToken));
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as {
          type?: string;
          notification?: NotificationResponse;
        };
        if (parsed.type === "NOTIFICATION" && parsed.notification) {
          applyRealtimeNotification(queryClient, parsed.notification, true, navigate);
        }
      } catch {
        // ignore malformed websocket payloads
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [isLoggedIn, navigate, queryClient]);
}

export function useNotifications() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => (await listNotifications()).map(toUiNotification),
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadNotificationCount,
    enabled: isLoggedIn,
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData<UiNotification[]>(NOTIFICATIONS_KEY, (prev) => {
        const rows = prev ?? [];
        return rows.map((item) =>
          item.id === updated.id ? toUiNotification(updated) : item,
        );
      });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<UiNotification[]>(NOTIFICATIONS_KEY, (prev) =>
        (prev ?? []).map((item) => ({ ...item, read: true })),
      );
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0);
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? notifications.filter((n) => !n.read).length;

  const markRead = useCallback(
    (id: string) => {
      queryClient.setQueryData<UiNotification[]>(NOTIFICATIONS_KEY, (prev) =>
        (prev ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (prev) =>
        Math.max(0, (prev ?? 0) - 1),
      );
      markReadMutation.mutate(id);
    },
    [markReadMutation, queryClient],
  );

  const markAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading: notificationsQuery.isLoading,
      markRead,
      markAllRead,
    }),
    [markAllRead, markRead, notifications, notificationsQuery.isLoading, unreadCount],
  );
}
