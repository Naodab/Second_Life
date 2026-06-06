import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConversationResponse, MessageResponse } from "@/api/conversations";
import MessagesPage from "./MessagesPage";
import type { MessagesTab } from "./useMessagesPage";

const useMessagesPageMock = vi.fn();

vi.mock("./useMessagesPage", () => ({
  useMessagesPage: () => useMessagesPageMock(),
}));

const conversationFixture: ConversationResponse = {
  id: "conv-1",
  buyerProfileId: "buyer-1",
  sellerProfileId: "seller-1",
  facilityId: "fac-1",
  facilityName: "Green Loop Store",
  facilityImageUrl: "https://res.cloudinary.com/demo/facility.jpg",
  lastMessagePreview: "Xin chào",
  lastMessageAt: "2026-06-06T10:00:00.000Z",
  unreadCount: 0,
  createdAt: "2026-06-06T09:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
};

function buildMessage(index: number): MessageResponse {
  return {
    id: `msg-${index}`,
    conversationId: "conv-1",
    senderProfileId: index % 2 === 0 ? "buyer-1" : "seller-1",
    content: `Tin nhắn số ${index}`,
    createdAt: `2026-06-06T10:${String(index).padStart(2, "0")}:00.000Z`,
  };
}

function mockMessagesPageState(
  overrides: Partial<ReturnType<typeof defaultMessagesPageState>> = {},
) {
  useMessagesPageMock.mockReturnValue({
    ...defaultMessagesPageState(),
    ...overrides,
  });
}

function defaultMessagesPageState() {
  return {
    tab: "facilities" as MessagesTab,
    changeTab: vi.fn(),
    conversations: [] as ConversationResponse[],
    conversationsLoading: false,
    searchQuery: "",
    setSearchQuery: vi.fn(),
    hasConversationSearch: false,
    hasAnyConversations: false,
    buyerUnreadCount: 0,
    sellerUnreadCount: 0,
    activeConversation: null as ConversationResponse | null,
    activeConversationId: null as string | null,
    selectConversation: vi.fn(),
    messages: [] as MessageResponse[],
    messagesLoading: false,
    sendMessage: vi.fn(),
    openingConversation: false,
    profileId: "buyer-1",
    isMine: (senderId: string) => senderId === "buyer-1",
    formatConversationTime: () => "10:00",
  };
}

describe("MessagesPage scroll layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessagesPageState();
  });

  it("constrains page shell to viewport below site header", () => {
    render(<MessagesPage />);

    const shell = screen.getByTestId("messages-page-shell");
    expect(shell.className).toContain("overflow-hidden");
    expect(shell.className).toContain("h-[calc(100dvh-var(--site-header-height))]");
    expect(shell.className).toContain("max-h-[calc(100dvh-var(--site-header-height))]");
  });

  it("uses scrollable conversation list region", () => {
    mockMessagesPageState({
      conversations: Array.from({ length: 12 }, (_, index) => ({
        ...conversationFixture,
        id: `conv-${index}`,
        facilityName: `Cơ sở ${index}`,
        lastMessagePreview: `Preview ${index}`,
      })),
    });

    render(<MessagesPage />);

    const list = screen.getByTestId("messages-conversation-list");
    expect(list.className).toContain("overflow-y-auto");
    expect(list.className).toContain("min-h-0");
    expect(list.className).toContain("flex-1");
    expect(screen.getByText("Cơ sở 0")).toBeInTheDocument();
    expect(screen.getByText("Cơ sở 11")).toBeInTheDocument();
  });

  it("uses scrollable message thread when a conversation is open", () => {
    mockMessagesPageState({
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: Array.from({ length: 20 }, (_, index) => buildMessage(index)),
    });

    render(<MessagesPage />);

    const thread = screen.getByTestId("messages-thread-scroll");
    expect(thread.className).toContain("overflow-y-auto");
    expect(thread.className).toContain("min-h-0");
    expect(thread.className).toContain("flex-1");
    expect(screen.getByText("Tin nhắn số 0")).toBeInTheDocument();
    expect(screen.getByText("Tin nhắn số 19")).toBeInTheDocument();
  });

  it("scrolls message thread to the latest message after load", async () => {
    mockMessagesPageState({
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: [],
      messagesLoading: true,
    });

    const { rerender } = render(<MessagesPage />);

    const thread = screen.getByTestId("messages-thread-scroll");
    Object.defineProperty(thread, "scrollHeight", { configurable: true, value: 2400 });
    let scrollTop = 0;
    Object.defineProperty(thread, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    mockMessagesPageState({
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: Array.from({ length: 5 }, (_, index) => buildMessage(index)),
      messagesLoading: false,
    });
    rerender(<MessagesPage />);

    await waitFor(() => {
      expect(scrollTop).toBe(2400);
    });
  });

  it("renders facility avatar image in conversation list for facilities tab", () => {
    mockMessagesPageState({
      conversations: [conversationFixture],
      hasAnyConversations: true,
    });

    render(<MessagesPage />);

    expect(screen.getByRole("img", { name: "Green Loop Store" })).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo/facility.jpg",
    );
  });

  it("filters conversation list from search input", () => {
    const setSearchQuery = vi.fn();
    mockMessagesPageState({
      conversations: [conversationFixture],
      hasAnyConversations: true,
      searchQuery: "green",
      setSearchQuery,
    });

    render(<MessagesPage />);

    const input = screen.getByTestId("messages-conversation-search");
    expect(input).toHaveValue("green");
    expect(input).toHaveAttribute("placeholder", "Tìm cơ sở hoặc tin nhắn...");
    expect(screen.getByText("Green Loop Store")).toBeInTheDocument();
  });

  it("shows no-results copy when search matches nothing", () => {
    mockMessagesPageState({
      conversations: [],
      hasAnyConversations: true,
      hasConversationSearch: true,
      searchQuery: "missing",
    });

    render(<MessagesPage />);

    expect(
      screen.getByText('Không tìm thấy cuộc trò chuyện phù hợp với "missing".'),
    ).toBeInTheDocument();
  });

  it("calls setSearchQuery when user edits search input", () => {
    const setSearchQuery = vi.fn();
    mockMessagesPageState({
      conversations: [conversationFixture],
      hasAnyConversations: true,
      setSearchQuery,
    });

    render(<MessagesPage />);

    fireEvent.change(screen.getByTestId("messages-conversation-search"), {
      target: { value: "green loop" },
    });

    expect(setSearchQuery).toHaveBeenCalledWith("green loop");
  });

  it("uses customers tab search placeholder", () => {
    mockMessagesPageState({
      tab: "customers",
      conversations: [conversationFixture],
      hasAnyConversations: true,
    });

    render(<MessagesPage />);

    expect(screen.getByTestId("messages-conversation-search")).toHaveAttribute(
      "placeholder",
      "Tìm khách, cơ sở hoặc tin nhắn...",
    );
  });

  it("renders only conversations returned from filtered hook state", () => {
    mockMessagesPageState({
      conversations: [
        {
          ...conversationFixture,
          id: "conv-2",
          facilityName: "Vintage Hub",
          lastMessagePreview: "Còn hàng không?",
        },
      ],
      hasAnyConversations: true,
      searchQuery: "vintage",
      hasConversationSearch: true,
    });

    render(<MessagesPage />);

    expect(screen.getByText("Vintage Hub")).toBeInTheDocument();
    expect(screen.queryByText("Green Loop Store")).not.toBeInTheDocument();
  });

  it("links facility name in chat header to facility page on facilities tab", () => {
    mockMessagesPageState({
      tab: "facilities",
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: [buildMessage(1)],
    });

    render(<MessagesPage />);

    const link = screen.getByRole("link", { name: "Green Loop Store" });
    expect(link).toHaveAttribute("href", "/facility/fac-1");
  });

  it("does not link customer title on customers tab", () => {
    mockMessagesPageState({
      tab: "customers",
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: [buildMessage(1)],
    });

    render(<MessagesPage />);

    expect(screen.queryByRole("link", { name: /Khách/ })).not.toBeInTheDocument();
    expect(screen.getByText("Khách buyer-1")).toBeInTheDocument();
  });

  it("keeps layout card overflow hidden so inner regions handle scroll", () => {
    mockMessagesPageState({
      activeConversationId: "conv-1",
      activeConversation: conversationFixture,
      messages: [buildMessage(1)],
    });

    render(<MessagesPage />);

    const card = screen.getByTestId("messages-layout-card");
    expect(card.className).toContain("overflow-hidden");
    expect(card.className).toContain("min-h-0");
    expect(card.className).toContain("flex-1");
  });
});
