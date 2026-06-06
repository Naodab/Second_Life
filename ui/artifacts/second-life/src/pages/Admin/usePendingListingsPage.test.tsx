import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminApproveListing,
  adminListPendingListings,
  adminRejectListing,
} from "@/api/listing";
import { usePendingListingsPage } from "./usePendingListingsPage";

const adminListPendingListingsMock = vi.mocked(adminListPendingListings);
const adminApproveListingMock = vi.mocked(adminApproveListing);
const adminRejectListingMock = vi.mocked(adminRejectListing);

vi.mock("@/api/listing", () => ({
  adminListPendingListings: vi.fn(),
  adminApproveListing: vi.fn(),
  adminRejectListing: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
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

const listingFixture = {
  id: "listing-1",
  title: "Máy ảnh film",
  description: null,
  listingType: "BUY" as const,
  listingStatus: "PENDING" as const,
  minPrice: 500_000,
  maxPrice: 500_000,
  productId: "product-1",
  productName: "Canon AE-1",
  thumbnailImage: null,
  facilityId: "facility-1",
  facilityName: "Green Loop",
  facilityImageUrl: null,
  facilityAddress: "Hà Nội",
  averageRating: null,
  primarySubCategoryName: "Máy ảnh",
};

describe("usePendingListingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminListPendingListingsMock.mockResolvedValue({
      page: 0,
      pageSize: 10,
      totalCount: 1,
      items: [listingFixture],
    });
    adminApproveListingMock.mockResolvedValue({
      id: "listing-1",
      productId: "product-1",
      facilityId: "facility-1",
      title: "Máy ảnh film",
      description: null,
      listingType: "BUY",
      listingStatus: "ACTIVE",
      minPrice: 500_000,
      maxPrice: 500_000,
      variants: [],
    });
    adminRejectListingMock.mockResolvedValue({
      id: "listing-1",
      productId: "product-1",
      facilityId: "facility-1",
      title: "Máy ảnh film",
      description: null,
      listingType: "BUY",
      listingStatus: "REJECTED",
      minPrice: 500_000,
      maxPrice: 500_000,
      variants: [],
    });
  });

  it("loads pending listings for the current page", async () => {
    const { result } = renderHook(() => usePendingListingsPage(0, 10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(adminListPendingListingsMock).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
  });

  it("approves a listing and refetches pending list", async () => {
    const { result } = renderHook(() => usePendingListingsPage(0, 10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.approve("listing-1");
    });

    await waitFor(() => expect(adminApproveListingMock.mock.calls[0]?.[0]).toBe("listing-1"));
    await waitFor(() => expect(adminListPendingListingsMock).toHaveBeenCalledTimes(2));
  });

  it("rejects a listing and refetches pending list", async () => {
    const { result } = renderHook(() => usePendingListingsPage(0, 10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.reject("listing-1");
    });

    await waitFor(() => expect(adminRejectListingMock.mock.calls[0]?.[0]).toBe("listing-1"));
    await waitFor(() => expect(adminListPendingListingsMock).toHaveBeenCalledTimes(2));
  });
});
