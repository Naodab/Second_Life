import type { QueryClient } from "@tanstack/react-query";

import { markNotificationRead } from "@/api/notifications";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

export type NotificationLinkTarget = {
  id: string;
  read: boolean;
  link?: string;
};

export function notificationLinkToAppPath(link: string): string {
  try {
    const url = new URL(link, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return link;
  }
}

export function markNotificationReadOptimistic(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<NotificationLinkTarget[]>(NOTIFICATIONS_KEY, (prev) =>
    (prev ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
  queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (prev) => Math.max(0, (prev ?? 0) - 1));
  void markNotificationRead(id).catch(() => {
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  });
}

export function openNotificationLink(
  notification: NotificationLinkTarget,
  navigate: (path: string) => void,
  queryClient: QueryClient,
) {
  if (!notification.read) {
    markNotificationReadOptimistic(queryClient, notification.id);
  }
  if (notification.link) {
    navigate(notificationLinkToAppPath(notification.link));
  }
}
