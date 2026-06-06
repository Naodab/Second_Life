import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSetup from "./ProfileSetup";
import { useAuth } from "@/context/AuthContext";
import { getCurrentProfile } from "@/api";
import { ADMIN_HOME } from "@/lib/admin-paths";

const setLocationMock = vi.fn();

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["", setLocationMock],
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/api", () => ({
  getCurrentProfile: vi.fn(),
  updateCurrentProfile: vi.fn(),
  profileNeedsSetup: vi.fn(() => true),
  profileIsCompleteForSellerHub: vi.fn(() => false),
}));

const useAuthMock = vi.mocked(useAuth);
const getCurrentProfileMock = vi.mocked(getCurrentProfile);

describe("ProfileSetup admin bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/profile/setup");
    getCurrentProfileMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      firstName: null,
      lastName: null,
      phoneNumber: null,
    });
  });

  it("redirects admin away without showing profile form", async () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: true,
      needsProfileSetup: false,
      sellerHubProfileComplete: false,
      user: {
        id: "admin-1",
        email: "admin@example.com",
        name: "admin",
        avatar: null,
        firstName: null,
        lastName: null,
      },
      refreshSessionProfile: vi.fn(),
    } as ReturnType<typeof useAuth>);

    render(<ProfileSetup />);

    await waitFor(() => {
      expect(setLocationMock).toHaveBeenCalledWith("/");
    });
  });

  it("redirects admin to admin home instead of seller hub returnTo", async () => {
    window.history.replaceState({}, "", "/profile/setup?returnTo=%2Fmanage");
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: true,
      needsProfileSetup: false,
      sellerHubProfileComplete: false,
      user: {
        id: "admin-1",
        email: "admin@example.com",
        name: "admin",
        avatar: null,
        firstName: null,
        lastName: null,
      },
      refreshSessionProfile: vi.fn(),
    } as ReturnType<typeof useAuth>);

    render(<ProfileSetup />);

    await waitFor(() => {
      expect(setLocationMock).toHaveBeenCalledWith(ADMIN_HOME);
    });
  });
});
