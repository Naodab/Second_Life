import { customFetch } from "@workspace/api-client-react";

import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type NotificationType = "ORDER" | "DELIVERY" | "SYSTEM";

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
  orderId?: string | null;
  orderType?: string | null;
};

export async function listNotifications(limit = 50): Promise<NotificationResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<NotificationResponse[]>>("/api/v1/notifications", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    query: { limit },
  });
  const rows = unwrapApiData(raw);
  return Array.isArray(rows) ? rows : [];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const raw = await customFetch<ApiResponseEnvelope<{ count: number }>>("/api/v1/notifications/unread-count", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = unwrapApiData(raw);
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markNotificationRead(id: string): Promise<NotificationResponse> {
  const raw = await customFetch<ApiResponseEnvelope<NotificationResponse>>(
    `/api/v1/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

export async function markAllNotificationsRead(): Promise<void> {
  await customFetch<ApiResponseEnvelope<void>>("/api/v1/notifications/read-all", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
}

export function resolveNotificationWebSocketUrl(): string {
  const raw = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim();
  const base = raw ? raw.replace(/\/+$/, "") : `${window.location.protocol}//${window.location.host}`;
  const wsBase = base.replace(/^http/i, "ws");
  return `${wsBase}/api/v1/ws/notifications`;
}
