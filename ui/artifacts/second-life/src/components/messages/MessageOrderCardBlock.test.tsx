import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageOrderCardBlock } from "./MessageOrderCardBlock";

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <div data-href={href}>{children}</div>
  ),
}));

describe("MessageOrderCardBlock", () => {
  it("links to orders tab and shows order info", () => {
    render(
      <MessageOrderCardBlock
        card={{
          orderId: "order-1",
          orderType: "RENT",
          status: "CONFIRMED",
          title: "Lều cắm trại",
          amount: 450_000,
          thumbnailUrl: "https://example.com/tent.jpg",
        }}
      />,
    );

    const link = screen.getByText("Xem đơn hàng").closest("[data-href]");
    expect(link).toHaveAttribute("data-href", "/orders?tab=CONFIRMED");
    expect(screen.getByText("Lều cắm trại")).toBeInTheDocument();
    expect(screen.getByText("Đơn thuê")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái: Đã xác nhận")).toBeInTheDocument();
    expect(screen.getByText("450.000 ₫")).toBeInTheDocument();
  });

  it("falls back to /orders when status is missing", () => {
    render(
      <MessageOrderCardBlock
        card={{
          orderId: "order-2",
          orderType: "BUY",
          title: "Ghế gỗ",
        }}
      />,
    );
    const link = screen.getByText("Xem đơn hàng").closest("[data-href]");
    expect(link).toHaveAttribute("data-href", "/orders");
    expect(screen.getByText("Đơn mua")).toBeInTheDocument();
  });
});
