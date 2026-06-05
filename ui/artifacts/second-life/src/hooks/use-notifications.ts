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

export function useNotifications() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

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

  const upsertRealtimeNotification = useCallback(
    (payload: NotificationResponse) => {
      const ui = toUiNotification(payload);
      queryClient.setQueryData<UiNotification[]>(NOTIFICATIONS_KEY, (prev) =>
        mergeNotification(prev ?? [], ui),
      );
      if (!ui.read) {
        queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (prev) => (prev ?? 0) + 1);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    if (!Cookies.get("accessToken")) {
      return;
    }

    const socket = new WebSocket(resolveNotificationWebSocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as {
          type?: string;
          notification?: NotificationResponse;
        };
        if (parsed.type === "NOTIFICATION" && parsed.notification) {
          upsertRealtimeNotification(parsed.notification);
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
  }, [isLoggedIn, upsertRealtimeNotification]);

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
