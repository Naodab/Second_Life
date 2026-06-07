import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createConversation,
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from "@/api/conversations";
import { useMessagesPage } from "./useMessagesPage";
import { markInitialAttachSent } from "@/lib/message-navigation";

const { useSearchMock, setLocationMock } = vi.hoisted(() => ({
  useSearchMock: vi.fn(() => ""),
  setLocationMock: vi.fn(),
}));

const createConversationMock = vi.mocked(createConversation);
const listConversationsMock = vi.mocked(listConversations);
const listConversationMessagesMock = vi.mocked(listConversationMessages);
const sendConversationMessageMock = vi.mocked(sendConversationMessage);
const markConversationReadMock = vi.mocked(markConversationRead);

vi.mock("wouter", () => ({
  useSearch: () => useSearchMock(),
  useLocation: () => ["", setLocationMock],
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "buyer-1" } }),
}));

vi.mock("@/api/conversations", () => ({
  createConversation: vi.fn(),
  getOrCreateAdminSupportConversation: vi.fn(),
  listConversations: vi.fn(),
  listConversationMessages: vi.fn(),
  markConversationRead: vi.fn(),
  sendConversationMessage: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const conversationFixture = {
  id: "conv-1",
  buyerProfileId: "buyer-1",
  sellerProfileId: "seller-1",
  facilityId: "fac-1",
  facilityName: "Green Loop Store",
  facilityImageUrl: "https://res.cloudinary.com/demo/facility.jpg",
  lastMessagePreview: "[Sản phẩm] Máy ảnh",
  lastMessageAt: "2026-06-06T10:00:00.000Z",
  unreadCount: 0,
  createdAt: "2026-06-06T09:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
};

describe("useMessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useSearchMock.mockReturnValue("");
    listConversationsMock.mockResolvedValue([conversationFixture]);
    listConversationMessagesMock.mockResolvedValue([]);
    markConversationReadMock.mockResolvedValue(conversationFixture);
    createConversationMock.mockResolvedValue(conversationFixture);
  });

  it("loads buyer conversations", async () => {
    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(listConversationsMock).toHaveBeenCalledWith("buyer");
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.facilityName).toBe("Green Loop Store");
  });

  it("opens conversation from product deep link with initial product card", async () => {
    useSearchMock.mockReturnValue(
      "?facilityId=fac-1&listingId=listing-1&productTitle=M%C3%A1y%20%E1%BA%A3nh&listingType=RENT",
    );

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(createConversationMock).toHaveBeenCalled();
      expect(result.current.activeConversationId).toBe("conv-1");
    });
    expect(createConversationMock.mock.calls[0]?.[0]).toEqual({
      facilityId: "fac-1",
      productCard: {
        listingId: "listing-1",
        listingVariantId: undefined,
        title: "Máy ảnh",
        thumbnailUrl: undefined,
        listingType: "RENT",
        price: undefined,
      },
    });
    expect(setLocationMock).toHaveBeenCalledWith("/messages", { replace: true });
  });

  it("reopens conversation without resending product card on repeat deep link", async () => {
    const context = {
      facilityId: "fac-1",
      listingId: "listing-1",
      productTitle: "Máy ảnh",
      listingType: "RENT",
    };
    markInitialAttachSent(context);
    useSearchMock.mockReturnValue(
      "?facilityId=fac-1&listingId=listing-1&productTitle=M%C3%A1y%20%E1%BA%A3nh&listingType=RENT",
    );

    renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(createConversationMock).toHaveBeenCalled();
    });
    expect(createConversationMock.mock.calls[0]?.[0]).toEqual({ facilityId: "fac-1" });
  });

  it("sends message for active conversation", async () => {
    sendConversationMessageMock.mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      senderProfileId: "buyer-1",
      content: "Shop ơi",
      createdAt: "2026-06-06T10:05:00.000Z",
    });

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    act(() => {
      result.current.selectConversation("conv-1");
    });

    await result.current.sendMessage({ content: "Shop ơi" });

    expect(sendConversationMessageMock).toHaveBeenCalledWith("conv-1", { content: "Shop ơi" });
  });

  it("identifies own messages via isMine", async () => {
    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(result.current.isMine("buyer-1")).toBe(true);
    expect(result.current.isMine("seller-1")).toBe(false);
  });

  it("marks unread conversation as read when selected", async () => {
    listConversationsMock.mockResolvedValue([{ ...conversationFixture, unreadCount: 2 }]);
    markConversationReadMock.mockResolvedValue({ ...conversationFixture, unreadCount: 0 });

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    act(() => {
      result.current.selectConversation("conv-1");
    });

    await waitFor(() => {
      expect(markConversationReadMock).toHaveBeenCalled();
    });
    expect(markConversationReadMock.mock.calls[0]?.[0]).toBe("conv-1");
  });

  it("filters facilities tab conversations by search query", async () => {
    listConversationsMock.mockResolvedValue([
      conversationFixture,
      {
        ...conversationFixture,
        id: "conv-2",
        facilityName: "Vintage Hub",
        lastMessagePreview: "Còn hàng không?",
      },
    ]);

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery("vintage");
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.facilityName).toBe("Vintage Hub");
    expect(result.current.hasConversationSearch).toBe(true);
  });

  it("keeps separate search queries per tab", async () => {
    listConversationsMock.mockImplementation((role) => {
      if (role === "buyer") {
        return Promise.resolve([conversationFixture]);
      }
      return Promise.resolve([
        {
          ...conversationFixture,
          id: "conv-seller",
          buyerProfileId: "buyer-beta",
          facilityName: "Seller Facility",
        },
      ]);
    });

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    act(() => {
      result.current.setSearchQuery("green");
    });
    expect(result.current.searchQuery).toBe("green");

    act(() => {
      result.current.changeTab("customers");
    });

    await waitFor(() => {
      expect(result.current.searchQuery).toBe("");
    });

    act(() => {
      result.current.setSearchQuery("buyer-beta");
    });

    act(() => {
      result.current.changeTab("facilities");
    });

    expect(result.current.searchQuery).toBe("green");
  });

  it("filters customers tab conversations by buyer id on seller role", async () => {
    listConversationsMock.mockImplementation((role) => {
      if (role === "buyer") {
        return Promise.resolve([conversationFixture]);
      }
      return Promise.resolve([
        {
          ...conversationFixture,
          id: "conv-seller-1",
          buyerProfileId: "buyer-alpha",
          facilityName: "Alpha Shop",
        },
        {
          ...conversationFixture,
          id: "conv-seller-2",
          buyerProfileId: "buyer-beta",
          facilityName: "Beta Shop",
        },
      ]);
    });

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    act(() => {
      result.current.changeTab("customers");
    });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery("buyer-beta");
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.buyerProfileId).toBe("buyer-beta");
    expect(result.current.hasAnyConversations).toBe(true);
  });

  it("reports hasAnyConversations when search filters out all rows", async () => {
    listConversationsMock.mockResolvedValue([conversationFixture]);

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.hasAnyConversations).toBe(true);
    });

    act(() => {
      result.current.setSearchQuery("không tồn tại");
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(result.current.hasAnyConversations).toBe(true);
    expect(result.current.hasConversationSearch).toBe(true);
  });

  it("filters facilities tab by last message preview", async () => {
    listConversationsMock.mockResolvedValue([
      conversationFixture,
      {
        ...conversationFixture,
        id: "conv-2",
        facilityName: "Other Shop",
        lastMessagePreview: "Ship COD được không?",
      },
    ]);

    const { result } = renderHook(() => useMessagesPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery("máy ảnh");
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.id).toBe("conv-1");
  });
});
