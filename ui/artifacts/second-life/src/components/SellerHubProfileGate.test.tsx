import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SellerHubProfileGate } from "./SellerHubProfileGate";
import { useAuth } from "@/context/AuthContext";

const setLocationMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/manage/listings", setLocationMock],
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

import { ADMIN_HOME } from "@/lib/admin-paths";

describe("SellerHubProfileGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects admin away from seller hub", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: true,
      sellerHubProfileComplete: false,
      needsProfileSetup: false,
    } as ReturnType<typeof useAuth>);

    render(<SellerHubProfileGate />);

    expect(setLocationMock).toHaveBeenCalledWith(ADMIN_HOME, { replace: true });
  });

  it("redirects regular user with incomplete seller profile to profile setup", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: false,
      sellerHubProfileComplete: false,
      needsProfileSetup: true,
    } as ReturnType<typeof useAuth>);

    render(<SellerHubProfileGate />);

    expect(setLocationMock).toHaveBeenCalledWith("/profile/setup?returnTo=%2Fmanage%2Flistings");
  });

  it("does not redirect when seller profile is complete", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: false,
      sellerHubProfileComplete: true,
      needsProfileSetup: false,
    } as ReturnType<typeof useAuth>);

    render(<SellerHubProfileGate />);

    expect(setLocationMock).not.toHaveBeenCalled();
  });
});
