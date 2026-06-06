import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminListAccounts } from "@/api/admin";
import { useAdminUsersPage } from "./useAdminUsersPage";

const adminListAccountsMock = vi.mocked(adminListAccounts);

vi.mock("@/api/admin", () => ({
  adminListAccounts: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminListAccountsMock.mockResolvedValue({
      page: 0,
      pageSize: 15,
      totalCount: 1,
      items: [
        {
          id: "acc-1",
          email: "user@example.com",
          role: "USER",
          authProvider: "LOCAL",
          emailVerified: true,
          active: true,
          profileId: "profile-1",
        },
      ],
    });
  });

  it("loads admin accounts with filters", async () => {
    const { result } = renderHook(
      () => useAdminUsersPage(0, 15, "user@", "USER", "true"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminListAccountsMock).toHaveBeenCalledWith({
      page: 0,
      pageSize: 15,
      keyword: "user@",
      accountRole: "USER",
      emailVerified: true,
    });
    expect(result.current.data?.items).toHaveLength(1);
  });
});
