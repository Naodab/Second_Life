import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PendingListingsView } from "./PendingListingsView";

const usePendingListingsPageMock = vi.fn();

vi.mock("./usePendingListingsPage", () => ({
  usePendingListingsPage: (...args: unknown[]) => usePendingListingsPageMock(...args),
}));

const listingRow = {
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

function mockHookState(
  overrides: Partial<ReturnType<typeof usePendingListingsPageMock>> = {},
) {
  usePendingListingsPageMock.mockReturnValue({
    items: [listingRow],
    totalCount: 1,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    actingId: null,
    isActing: false,
    ...overrides,
  });
}

describe("PendingListingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState();
  });

  it("renders pending listings table", () => {
    render(<PendingListingsView />);
    expect(screen.getByRole("heading", { name: "Duyệt bài đăng" })).toBeInTheDocument();
    expect(screen.getByText("Máy ảnh film")).toBeInTheDocument();
    expect(screen.getByText("Green Loop")).toBeInTheDocument();
  });

  it("shows empty state when there are no pending listings", () => {
    mockHookState({ items: [], totalCount: 0 });
    render(<PendingListingsView />);
    expect(screen.getByText("Không có bài đăng nào đang chờ duyệt.")).toBeInTheDocument();
  });

  it("confirms approve action before calling mutation", async () => {
    const user = userEvent.setup();
    const approve = vi.fn();
    mockHookState({ approve });

    render(<PendingListingsView />);
    await user.click(screen.getByRole("button", { name: "Duyệt" }));
    expect(approve).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(approve).toHaveBeenCalledWith("listing-1");
  });

  it("confirms reject action before calling mutation", async () => {
    const user = userEvent.setup();
    const reject = vi.fn();
    mockHookState({ reject });

    render(<PendingListingsView />);
    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(reject).toHaveBeenCalledWith("listing-1");
  });
});
