import { describe, expect, it } from "vitest";

import type { ConversationResponse } from "@/api/conversations";
import {
  filterConversationsBySearch,
  messagesSearchPlaceholder,
} from "./messages-conversation-search";

const baseConversation = (overrides: Partial<ConversationResponse> = {}): ConversationResponse => ({
  id: "conv-1",
  buyerProfileId: "buyer-alpha",
  sellerProfileId: "seller-1",
  facilityId: "fac-1",
  facilityName: "Green Loop Store",
  lastMessagePreview: "[Sản phẩm] Máy ảnh",
  lastMessageAt: "2026-06-06T10:00:00.000Z",
  unreadCount: 0,
  createdAt: "2026-06-06T09:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
  ...overrides,
});

describe("filterConversationsBySearch", () => {
  const rows = [
    baseConversation({ id: "conv-1", facilityName: "Green Loop Store" }),
    baseConversation({
      id: "conv-2",
      facilityName: "Vintage Hub",
      lastMessagePreview: "Còn hàng không shop?",
    }),
  ];

  it("returns all conversations when query is blank", () => {
    expect(filterConversationsBySearch(rows, "facilities", "  ")).toEqual(rows);
  });

  it("filters facilities tab by facility name", () => {
    expect(filterConversationsBySearch(rows, "facilities", "green loop")).toEqual([rows[0]]);
  });

  it("filters facilities tab by last message preview", () => {
    expect(filterConversationsBySearch(rows, "facilities", "máy ảnh")).toEqual([rows[0]]);
  });

  it("filters customers tab by buyer profile id", () => {
    const customerRows = [
      baseConversation({ id: "conv-3", buyerProfileId: "buyer-alpha" }),
      baseConversation({ id: "conv-4", buyerProfileId: "buyer-beta" }),
    ];

    expect(filterConversationsBySearch(customerRows, "customers", "buyer-beta")).toEqual([
      customerRows[1],
    ]);
  });

  it("filters customers tab by facility name", () => {
    expect(filterConversationsBySearch(rows, "customers", "vintage")).toEqual([rows[1]]);
  });

  it("filters customers tab by last message preview", () => {
    expect(filterConversationsBySearch(rows, "customers", "còn hàng")).toEqual([rows[1]]);
  });

  it("does not match buyer profile id on facilities tab", () => {
    const customerRows = [
      baseConversation({ id: "conv-3", buyerProfileId: "buyer-secret" }),
      baseConversation({ id: "conv-4", buyerProfileId: "buyer-other", facilityName: "Other Shop" }),
    ];

    expect(filterConversationsBySearch(customerRows, "facilities", "buyer-secret")).toEqual([]);
  });

  it("returns empty list when nothing matches", () => {
    expect(filterConversationsBySearch(rows, "facilities", "không có")).toEqual([]);
  });

  it("matches case-insensitively", () => {
    expect(filterConversationsBySearch(rows, "facilities", "VINTAGE HUB")).toEqual([rows[1]]);
  });

  it("trims whitespace from query", () => {
    expect(filterConversationsBySearch(rows, "facilities", "  green loop  ")).toEqual([rows[0]]);
  });
});

describe("messagesSearchPlaceholder", () => {
  it("returns facilities placeholder", () => {
    expect(messagesSearchPlaceholder("facilities")).toBe("Tìm cơ sở hoặc tin nhắn...");
  });

  it("returns customers placeholder", () => {
    expect(messagesSearchPlaceholder("customers")).toBe("Tìm khách, cơ sở hoặc tin nhắn...");
  });
});
