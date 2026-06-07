import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ConversationResponse, MessageResponse } from "@/api/conversations";
import {
  REALTIME_ALERT_TOAST_DURATION_MS,
  useNotificationRealtimeSync,
} from "./use-notifications";

const toastMock = vi.fn();
const navigateMock = vi.fn();

const { latestSocketRef, authStateRef } = vi.hoisted(() => ({
  latestSocketRef: { current: null as MockWebSocket | null },
  authStateRef: {
    current: {
      isLoggedIn: true,
      user: { id: "buyer-1" },
      isAdmin: false,
    },
  },
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    latestSocketRef.current = this;
  }
}

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(() => "access-token"),
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authStateRef.current,
}));

vi.mock("@/api/notifications", () => ({
  resolveNotificationWebSocketUrl: vi.fn(() => "ws://localhost/notifications"),
}));

vi.mock("@/lib/message-focus", () => ({
  shouldAlertForIncomingMessage: vi.fn(() => true),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const conversationFixture: ConversationResponse = {
  id: "conv-1",
  buyerProfileId: "buyer-1",
  sellerProfileId: "seller-1",
  facilityId: "fac-1",
  facilityName: "Green Loop",
  lastMessagePreview: "Xin chào shop",
  lastMessageAt: "2026-06-06T10:00:00.000Z",
  unreadCount: 1,
  createdAt: "2026-06-06T09:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
};

const messageFixture: MessageResponse = {
  id: "msg-1",
  conversationId: "conv-1",
  senderProfileId: "seller-1",
  content: "Shop đây, cần gì ạ?",
  createdAt: "2026-06-06T10:00:00.000Z",
};

function emitSocketMessage(payload: unknown) {
  const socket = latestSocketRef.current;
  if (!socket?.onmessage) {
    throw new Error("Mock WebSocket handler is not ready");
  }
  socket.onmessage({ data: JSON.stringify(payload) } as MessageEvent);
}

describe("useNotificationRealtimeSync alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    latestSocketRef.current = null;
    authStateRef.current = {
      isLoggedIn: true,
      user: { id: "buyer-1" },
      isAdmin: false,
    };
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows notification toast for 10 seconds", () => {
    renderHook(() => useNotificationRealtimeSync(navigateMock), {
      wrapper: createWrapper(),
    });

    act(() => {
      emitSocketMessage({
        type: "NOTIFICATION",
        notification: {
          id: "notif-1",
          type: "ORDER",
          title: "Đơn hàng mới",
          body: "Bạn có đơn hàng #123",
          read: false,
          createdAt: "2026-06-06T10:00:00.000Z",
          link: "/orders",
        },
      });
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đơn hàng mới",
        description: "Bạn có đơn hàng #123",
        duration: REALTIME_ALERT_TOAST_DURATION_MS,
      }),
    );
    expect(REALTIME_ALERT_TOAST_DURATION_MS).toBe(10_000);
  });

  it("shows message toast for 10 seconds", () => {
    renderHook(() => useNotificationRealtimeSync(navigateMock), {
      wrapper: createWrapper(),
    });

    act(() => {
      emitSocketMessage({
        type: "MESSAGE",
        message: messageFixture,
        conversation: conversationFixture,
      });
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Green Loop",
        description: "Shop đây, cần gì ạ?",
        duration: REALTIME_ALERT_TOAST_DURATION_MS,
        className: "cursor-pointer",
      }),
    );
  });

  it("shows admin inbox message toast without profile id", () => {
    authStateRef.current = {
      isLoggedIn: true,
      user: { id: "" },
      isAdmin: true,
    };

    renderHook(() => useNotificationRealtimeSync(navigateMock), {
      wrapper: createWrapper(),
    });

    act(() => {
      emitSocketMessage({
        type: "MESSAGE",
        message: messageFixture,
        conversation: {
          ...conversationFixture,
          conversationType: "ADMIN",
          sellerProfileId: "__ADMIN_INBOX__",
        },
      });
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Shop đây, cần gì ạ?",
        duration: REALTIME_ALERT_TOAST_DURATION_MS,
      }),
    );
  });

  it("does not toast for messages sent by the current user", () => {
    renderHook(() => useNotificationRealtimeSync(navigateMock), {
      wrapper: createWrapper(),
    });

    act(() => {
      emitSocketMessage({
        type: "MESSAGE",
        message: { ...messageFixture, senderProfileId: "buyer-1" },
        conversation: conversationFixture,
      });
    });

    expect(toastMock).not.toHaveBeenCalled();
  });
});
