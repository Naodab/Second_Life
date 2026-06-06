import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrdersView } from "./OrdersView";

const useAdminOrdersPageMock = vi.fn();

vi.mock("./useAdminOrdersPage", () => ({
  useAdminOrdersPage: (...args: unknown[]) => useAdminOrdersPageMock(...args),
}));

describe("OrdersView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminOrdersPageMock.mockReturnValue({
      items: [
        {
          id: "order-1",
          customerId: "customer-1",
          customer: { firstName: "An", lastName: "Bùi", email: "an@example.com" },
          listingVariantId: "variant-1",
          quantity: 1,
          price: 120_000,
          status: "PENDING",
          createdAt: "2026-06-10T09:00:00",
        },
      ],
      totalCount: 1,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("renders buy orders by default", () => {
    render(<OrdersView />);
    expect(screen.getByRole("heading", { name: "Đơn hàng" })).toBeInTheDocument();
    expect(screen.getByText("order-1")).toBeInTheDocument();
    expect(screen.getByText("An Bùi")).toBeInTheDocument();
    expect(useAdminOrdersPageMock).toHaveBeenCalledWith("buy", 0, 15, "ALL");
  });

  it("switches to rent orders tab", async () => {
    const user = userEvent.setup();
    render(<OrdersView />);
    await user.click(screen.getByRole("tab", { name: "Đơn thuê" }));
    expect(useAdminOrdersPageMock).toHaveBeenLastCalledWith("rent", 0, 15, "ALL");
  });
});
