import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageProductCardBlock } from "./MessageProductCardBlock";

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <div data-href={href}>{children}</div>
  ),
}));

describe("MessageProductCardBlock", () => {
  it("links to listing detail and shows product info", () => {
    render(
      <MessageProductCardBlock
        card={{
          listingId: "listing-abc",
          title: "Áo khoác denim",
          listingType: "BUY",
          price: 120_000,
          thumbnailUrl: "https://example.com/jacket.jpg",
        }}
      />,
    );

    const link = screen.getByText("Xem chi tiết sản phẩm").closest("[data-href]");
    expect(link).toHaveAttribute("data-href", "/listing/listing-abc");
    expect(screen.getByText("Áo khoác denim")).toBeInTheDocument();
    expect(screen.getByText("Mua")).toBeInTheDocument();
    expect(screen.getByText("120.000 ₫")).toBeInTheDocument();
    expect(screen.getByAltText("Áo khoác denim")).toHaveAttribute("src", "https://example.com/jacket.jpg");
  });

  it("uses placeholder image when thumbnail is missing", () => {
    render(
      <MessageProductCardBlock
        card={{
          listingId: "listing-abc",
          title: "Sản phẩm không ảnh",
        }}
      />,
    );
    expect(screen.getByAltText("Sản phẩm không ảnh")).toHaveAttribute(
      "src",
      expect.stringContaining("unsplash.com"),
    );
  });
});
