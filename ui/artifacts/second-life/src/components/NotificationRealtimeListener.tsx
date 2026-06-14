import { useLocation } from "wouter";

import { useNotificationRealtimeSync } from "@/hooks/use-notifications";

export function NotificationRealtimeListener() {
  const [, navigate] = useLocation();
  useNotificationRealtimeSync(navigate);
  return null;
}
