import { describe, expect, it } from "vitest";

import type { ConversationResponse, MessageResponse } from "@/api/conversations";
import {
  conversationAlertTitle,
  mergeConversationRow,
  messagePreview,
  roleForViewer,
  sumConversationUnread,
} from "./conversations-cache";

const conversation: ConversationResponse = {
  id: "conv-1",
  buyerProfileId: "buyer-1",
  sellerProfileId: "seller-1",
  facilityId: "fac-1",
  facilityName: "Green Loop",
  lastMessagePreview: "Xin chào",
  lastMessageAt: "2026-06-06T10:00:00.000Z",
  unreadCount: 2,
  createdAt: "2026-06-06T09:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
};

describe("conversations-cache", () => {
  it("sums unread counts", () => {
    expect(
      sumConversationUnread([
        { ...conversation, unreadCount: 2 },
        { ...conversation, id: "conv-2", unreadCount: 3 },
      ]),
    ).toBe(5);
  });

  it("resolves viewer role", () => {
    expect(roleForViewer(conversation, "buyer-1")).toBe("buyer");
    expect(roleForViewer(conversation, "seller-1")).toBe("seller");
    expect(roleForViewer(conversation, "other")).toBeNull();
  });

  it("merges conversation to top of list", () => {
    const updated = { ...conversation, lastMessagePreview: "Mới" };
    expect(mergeConversationRow([{ ...conversation, id: "conv-2" }], updated)).toEqual([
      updated,
      { ...conversation, id: "conv-2" },
    ]);
  });

  it("builds message preview text", () => {
    const message: MessageResponse = {
      id: "msg-1",
      conversationId: "conv-1",
      senderProfileId: "seller-1",
      content: "Shop đây",
      createdAt: "2026-06-06T10:00:00.000Z",
    };
    expect(messagePreview(message)).toBe("Shop đây");
    expect(
      messagePreview({
        ...message,
        content: "",
        productCard: { listingId: "l1", title: "Máy ảnh" },
      }),
    ).toBe("[Sản phẩm] Máy ảnh");
  });

  it("builds alert title by role", () => {
    expect(conversationAlertTitle(conversation, "buyer")).toBe("Green Loop");
    expect(conversationAlertTitle(conversation, "seller")).toBe("Khách buyer-1");
  });
});
