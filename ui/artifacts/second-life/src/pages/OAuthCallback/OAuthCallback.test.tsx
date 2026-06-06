import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OAuthCallback from "./index";

const loginWithGoogleMock = vi.fn();
const setLocationMock = vi.fn();
const toastMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    loginWithGoogle: loginWithGoogleMock,
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["", setLocationMock],
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/api", () => ({
  appHref: (path: string) => path,
}));

describe("OAuthCallback page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "http://localhost",
        replace: replaceMock,
        search: "",
      },
    });
  });

  it("redirects to profile setup for new Google user", async () => {
    window.location.search = "?token=access-token&refresh_token=refresh-token";
    loginWithGoogleMock.mockResolvedValue(true);

    render(<OAuthCallback />);

    await waitFor(() => {
      expect(loginWithGoogleMock).toHaveBeenCalledWith("access-token", "refresh-token");
      expect(replaceMock).toHaveBeenCalledWith("http://localhost/profile/setup");
    });
  });

  it("redirects to home for Google user with complete profile", async () => {
    window.location.search = "?token=access-token&refresh_token=refresh-token";
    loginWithGoogleMock.mockResolvedValue(false);

    render(<OAuthCallback />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("http://localhost/");
    });
  });

  it("redirects admin to home instead of profile setup", async () => {
    window.location.search = "?token=admin-token&refresh_token=admin-refresh";
    loginWithGoogleMock.mockResolvedValue(false);

    render(<OAuthCallback />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("http://localhost/");
      expect(replaceMock).not.toHaveBeenCalledWith("http://localhost/profile/setup");
    });
  });

  it("shows error when tokens are missing", async () => {
    window.location.search = "";

    render(<OAuthCallback />);

    expect(await screen.findByText("Không nhận được token từ máy chủ đăng nhập")).toBeInTheDocument();
    expect(loginWithGoogleMock).not.toHaveBeenCalled();
  });

  it("shows error and toast when Google returns oauth error", async () => {
    window.location.search = "?error=access_denied&error_description=access%20denied";

    render(<OAuthCallback />);

    expect(await screen.findByText("Bạn đã hủy hoặc từ chối quyền truy cập với Google.")).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Đăng nhập Google thất bại" }),
    );
    expect(loginWithGoogleMock).not.toHaveBeenCalled();
  });
});
