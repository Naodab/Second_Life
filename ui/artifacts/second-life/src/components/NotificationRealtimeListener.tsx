import { useLocation } from "wouter";

import { useNotificationRealtimeSync } from "@/hooks/use-notifications";

/** Keeps notification WebSocket alive on every route (seller hub has no Header). */
export function NotificationRealtimeListener() {
  const [, navigate] = useLocation();
  useNotificationRealtimeSync(navigate);
  return null;
}
