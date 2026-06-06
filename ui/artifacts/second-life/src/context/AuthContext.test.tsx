import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import { fakeJwt } from "@/test/fake-jwt";
import type { ProfilePayload } from "@/api";

const cookieStore = vi.hoisted(() => new Map<string, string>());

const cookiesMock = vi.hoisted(() => ({
  get: vi.fn((name: string) => cookieStore.get(name)),
  set: vi.fn((name: string, value: string) => {
    cookieStore.set(name, value);
  }),
  remove: vi.fn((name: string) => {
    cookieStore.delete(name);
  }),
}));

const apiMock = vi.hoisted(() => ({
  login: vi.fn(),
  getProfileById: vi.fn(),
  getCurrentProfile: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("js-cookie", () => ({
  default: cookiesMock,
}));

vi.mock("@workspace/api-client-react", () => ({
  setAuthTokenGetter: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    login: (...args: unknown[]) => apiMock.login(...args),
    getProfileById: (...args: unknown[]) => apiMock.getProfileById(...args),
    getCurrentProfile: (...args: unknown[]) => apiMock.getCurrentProfile(...args),
    refreshToken: (...args: unknown[]) => apiMock.refreshToken(...args),
  };
});

const incompleteProfile: ProfilePayload = {
  id: "profile-1",
  email: "user@example.com",
  firstName: null,
  lastName: null,
  phoneNumber: null,
};

function userToken(email = "user@example.com", role = "USER") {
  return fakeJwt({ sub: email, profileId: "profile-1", role });
}

function adminToken(email = "admin@example.com") {
  return fakeJwt({ sub: email, profileId: "admin-profile", role: "ADMIN" });
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext auth flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.clear();
    cookiesMock.get.mockImplementation((name: string) => cookieStore.get(name));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("returns needsSetup=true and sets flags for regular user with incomplete profile", async () => {
      const accessToken = userToken();
      apiMock.login.mockResolvedValue({
        accessToken,
        refreshToken: "refresh-1",
        profile: incompleteProfile,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = false;
      await act(async () => {
        needsSetup = await result.current.login("user@example.com", "secret");
      });

      expect(needsSetup).toBe(true);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.needsProfileSetup).toBe(true);
      expect(result.current.sellerHubProfileComplete).toBe(false);
    });

    it("returns needsSetup=false for admin with incomplete profile", async () => {
      const accessToken = adminToken();
      apiMock.login.mockResolvedValue({
        accessToken,
        refreshToken: "refresh-admin",
        profile: { ...incompleteProfile, id: "admin-profile", email: "admin@example.com" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = true;
      await act(async () => {
        needsSetup = await result.current.login("admin@example.com", "secret");
      });

      expect(needsSetup).toBe(false);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.needsProfileSetup).toBe(false);
      expect(result.current.sellerHubProfileComplete).toBe(true);
    });

    it("returns needsSetup=false when admin login response has no profile", async () => {
      const accessToken = adminToken();
      apiMock.login.mockResolvedValue({
        accessToken,
        refreshToken: "refresh-admin",
        profile: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = true;
      await act(async () => {
        needsSetup = await result.current.login("admin@example.com", "secret");
      });

      expect(needsSetup).toBe(false);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.needsProfileSetup).toBe(false);
      expect(result.current.user?.email).toBe("admin@example.com");
    });
  });

  describe("loginWithGoogle", () => {
    it("returns needsSetup=true for new Google user with incomplete profile", async () => {
      const accessToken = userToken("google@example.com");
      apiMock.getProfileById.mockResolvedValue({
        ...incompleteProfile,
        email: "google@example.com",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = false;
      await act(async () => {
        needsSetup = await result.current.loginWithGoogle(accessToken, "google-refresh");
      });

      expect(needsSetup).toBe(true);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.needsProfileSetup).toBe(true);
    });

    it("returns needsSetup=false for admin after Google login", async () => {
      const accessToken = adminToken();
      apiMock.getProfileById.mockResolvedValue({
        ...incompleteProfile,
        id: "admin-profile",
        email: "admin@example.com",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = true;
      await act(async () => {
        needsSetup = await result.current.loginWithGoogle(accessToken, "google-admin-refresh");
      });

      expect(needsSetup).toBe(false);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.needsProfileSetup).toBe(false);
      expect(result.current.sellerHubProfileComplete).toBe(true);
    });

    it("falls back to JWT claims and skips setup for admin when profile fetch fails", async () => {
      const accessToken = adminToken();
      apiMock.getProfileById.mockRejectedValue(new Error("profile unavailable"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = true;
      await act(async () => {
        needsSetup = await result.current.loginWithGoogle(accessToken, "google-admin-refresh");
      });

      expect(needsSetup).toBe(false);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.needsProfileSetup).toBe(false);
      expect(result.current.sellerHubProfileComplete).toBe(true);
      expect(result.current.user?.email).toBe("admin@example.com");
    });

    it("falls back to JWT claims and requires setup for regular user when profile fetch fails", async () => {
      const accessToken = userToken("google@example.com");
      apiMock.getProfileById.mockRejectedValue(new Error("profile unavailable"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let needsSetup = false;
      await act(async () => {
        needsSetup = await result.current.loginWithGoogle(accessToken, "google-refresh");
      });

      expect(needsSetup).toBe(true);
      expect(result.current.needsProfileSetup).toBe(true);
      expect(result.current.sellerHubProfileComplete).toBe(false);
    });
  });
});
