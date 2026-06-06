import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAccessGate } from "./AdminAccessGate";
import { useAuth } from "@/context/AuthContext";

const setLocationMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/cart", setLocationMock],
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

describe("AdminAccessGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects admin away from cart", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: true,
    } as ReturnType<typeof useAuth>);

    render(<AdminAccessGate />);

    expect(setLocationMock).toHaveBeenCalledWith("/search", { replace: true });
  });

  it("does not redirect regular users", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: false,
    } as ReturnType<typeof useAuth>);

    render(<AdminAccessGate />);

    expect(setLocationMock).not.toHaveBeenCalled();
  });
});
