import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminListBuyOrders, adminListRentOrders } from "@/api/admin";
import { useAdminOrdersPage } from "./useAdminOrdersPage";

const adminListBuyOrdersMock = vi.mocked(adminListBuyOrders);
const adminListRentOrdersMock = vi.mocked(adminListRentOrders);

vi.mock("@/api/admin", () => ({
  adminListBuyOrders: vi.fn(),
  adminListRentOrders: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAdminOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminListBuyOrdersMock.mockResolvedValue({
      page: 0,
      pageSize: 15,
      totalCount: 1,
      items: [
        {
          id: "order-1",
          customerId: "customer-1",
          listingVariantId: "variant-1",
          quantity: 1,
          pickupTime: "2026-06-10T10:00:00",
          status: "PENDING",
        },
      ],
    });
    adminListRentOrdersMock.mockResolvedValue({
      page: 0,
      pageSize: 15,
      totalCount: 0,
      items: [],
    });
  });

  it("loads buy orders when kind is buy", async () => {
    const { result } = renderHook(() => useAdminOrdersPage("buy", 0, 15, "PENDING"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(adminListBuyOrdersMock).toHaveBeenCalledWith({
      page: 0,
      pageSize: 15,
      status: "PENDING",
    });
    expect(adminListRentOrdersMock).not.toHaveBeenCalled();
    expect(result.current.items).toHaveLength(1);
  });

  it("loads rent orders when kind is rent", async () => {
    const { result } = renderHook(() => useAdminOrdersPage("rent", 0, 15, "ALL"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(adminListRentOrdersMock).toHaveBeenCalledWith({
      page: 0,
      pageSize: 15,
      status: undefined,
    });
    expect(adminListBuyOrdersMock).not.toHaveBeenCalled();
  });
});
