import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Register from "./index";

const registerMock = vi.fn();
const redirectToGoogleOAuthMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/api", () => ({
  registerWithEmailPassword: (...args: unknown[]) => registerMock(...args),
  redirectToGoogleOAuth: (...args: unknown[]) => redirectToGoogleOAuthMock(...args),
}));

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/register");
  });

  it("starts Google register redirect", async () => {
    const user = userEvent.setup();

    render(<Register />);

    await user.click(screen.getByRole("button", { name: "Đăng ký với Google" }));

    expect(redirectToGoogleOAuthMock).toHaveBeenCalledWith("register");
  });

  it("shows success state after email registration", async () => {
    registerMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<Register />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "new@example.com");
    const passwordFields = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordFields[0], "secret123");
    await user.type(passwordFields[1], "secret123");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "secret123",
      });
      expect(screen.getByText("Kiểm tra email của bạn")).toBeInTheDocument();
    });
  });

  it("shows toast when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<Register />);

    await user.type(screen.getByPlaceholderText("ban@example.com"), "new@example.com");
    const passwordFields = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordFields[0], "secret123");
    await user.type(passwordFields[1], "different");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mật khẩu không khớp" }),
    );
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("shows toast for different provider register oauth error", () => {
    window.history.replaceState({}, "", "/register?oauth_error=different_provider_register");

    render(<Register />);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Đăng ký bằng Google không khả dụng" }),
    );
  });
});
