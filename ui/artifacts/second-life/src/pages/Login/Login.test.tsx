import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "./index";
import { UnverifiedEmailError } from "@/context/AuthContext";

const loginMock = vi.fn();
const setLocationMock = vi.fn();
const redirectToGoogleOAuthMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
    isLoggedIn: false,
  }),
  UnverifiedEmailError: class UnverifiedEmailError extends Error {
    constructor() {
      super("UNVERIFIED_EMAIL");
      this.name = "UnverifiedEmailError";
    }
  },
}));

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["", setLocationMock],
}));

vi.mock("@/api", () => ({
  redirectToGoogleOAuth: (...args: unknown[]) => redirectToGoogleOAuthMock(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/login");
  });

  it("redirects to profile setup after login when profile is incomplete", async () => {
    loginMock.mockResolvedValue(true);
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("user@example.com", "password123");
      expect(setLocationMock).toHaveBeenCalledWith("/profile/setup");
    });
  });

  it("redirects to returnTo after login when profile is complete", async () => {
    loginMock.mockResolvedValue(false);
    window.history.replaceState({}, "", "/login?returnTo=%2Forders");
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(setLocationMock).toHaveBeenCalledWith("/orders");
    });
  });

  it("redirects admin to home instead of profile setup", async () => {
    loginMock.mockResolvedValue(false);
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "admin@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(setLocationMock).toHaveBeenCalledWith("/");
      expect(setLocationMock).not.toHaveBeenCalledWith("/profile/setup");
    });
  });

  it("shows toast for unverified email", async () => {
    loginMock.mockRejectedValue(new UnverifiedEmailError());
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Tài khoản chưa được xác thực" }),
      );
    });
    expect(setLocationMock).not.toHaveBeenCalled();
  });

  it("starts Google login redirect", async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập bằng Gmail" }));

    expect(redirectToGoogleOAuthMock).toHaveBeenCalledWith("login");
  });
});
