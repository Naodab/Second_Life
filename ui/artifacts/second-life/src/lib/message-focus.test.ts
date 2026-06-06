import { describe, expect, it } from "vitest";

import {
  setFocusedConversationId,
  shouldAlertForIncomingMessage,
} from "./message-focus";

describe("message-focus", () => {
  it("suppresses alert for focused conversation", () => {
    setFocusedConversationId("conv-1");
    expect(shouldAlertForIncomingMessage("conv-1")).toBe(false);
    expect(shouldAlertForIncomingMessage("conv-2")).toBe(true);
    setFocusedConversationId(null);
    expect(shouldAlertForIncomingMessage("conv-1")).toBe(true);
  });
});
