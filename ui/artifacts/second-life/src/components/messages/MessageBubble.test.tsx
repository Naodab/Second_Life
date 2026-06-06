import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MessageResponse } from "@/api/conversations";
import { MessageBubble } from "./MessageBubble";

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <div data-testid="wouter-link" data-href={href}>
      {children}
    </div>
  ),
}));

function baseMessage(overrides: Partial<MessageResponse> = {}): MessageResponse {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderProfileId: "buyer-1",
    createdAt: "2026-06-06T10:30:00.000Z",
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders text content for peer message", () => {
    render(
      <MessageBubble
        message={baseMessage({ content: "Xin chào shop" })}
        isMine={false}
        peerFallback="S"
      />,
    );
    expect(screen.getByText("Xin chào shop")).toBeInTheDocument();
  });

  it("renders attached images", () => {
    render(
      <MessageBubble
        message={baseMessage({
          imageUrls: ["https://res.cloudinary.com/demo/image/upload/a.jpg"],
        })}
        isMine={true}
      />,
    );
    expect(screen.getByAltText("Ảnh đính kèm")).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo/image/upload/a.jpg",
    );
  });

  it("renders product card block", () => {
    render(
      <MessageBubble
        message={baseMessage({
          productCard: {
            listingId: "listing-1",
            title: "Máy ảnh vintage",
            listingType: "RENT",
            price: 150_000,
          },
        })}
        isMine={false}
      />,
    );
    expect(screen.getByText("Máy ảnh vintage")).toBeInTheDocument();
    expect(screen.getByText("Thuê")).toBeInTheDocument();
    expect(screen.getByText("150.000 ₫")).toBeInTheDocument();
  });

  it("renders order card block", () => {
    render(
      <MessageBubble
        message={baseMessage({
          orderCard: {
            orderId: "order-1",
            orderType: "BUY",
            status: "PENDING",
            title: "Ghế mây",
            amount: 320_000,
          },
        })}
        isMine={true}
      />,
    );
    expect(screen.getByText("Ghế mây")).toBeInTheDocument();
    expect(screen.getByText("Đơn mua")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái: Chờ xác nhận")).toBeInTheDocument();
  });

  it("does not render peer avatar for own messages", () => {
    const { container } = render(
      <MessageBubble message={baseMessage({ content: "Ok shop" })} isMine={true} />,
    );
    expect(container.querySelector('[data-slot="avatar"]')).toBeNull();
  });
});
