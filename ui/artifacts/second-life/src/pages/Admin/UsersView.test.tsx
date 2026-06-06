import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "./UsersView";

const useAdminUsersPageMock = vi.fn();

vi.mock("./useAdminUsersPage", () => ({
  useAdminUsersPage: (...args: unknown[]) => useAdminUsersPageMock(...args),
}));

function renderUsersView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersView />
    </QueryClientProvider>,
  );
}

describe("UsersView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminUsersPageMock.mockReturnValue({
      data: {
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
            profile: { firstName: "An", lastName: "Bùi" },
            createdAt: "2026-06-01T10:00:00",
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("renders admin users table", () => {
    renderUsersView();
    expect(screen.getByRole("heading", { name: "Người dùng" })).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("An Bùi")).toBeInTheDocument();
  });

  it("shows empty state when no accounts", () => {
    useAdminUsersPageMock.mockReturnValue({
      data: { page: 0, pageSize: 15, totalCount: 0, items: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    renderUsersView();
    expect(screen.getByText("Không tìm thấy tài khoản.")).toBeInTheDocument();
  });
});
