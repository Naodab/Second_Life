import { useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

/** Chỉ cho phép đường dẫn nội bộ (tránh open redirect). */
export function sanitizeReturnTo(path: string | null | undefined): string {
  const raw = path?.trim() ?? "";
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export function currentReturnTo(): string {
  return sanitizeReturnTo(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

export function loginPathWithReturn(returnTo?: string): string {
  const target = sanitizeReturnTo(returnTo ?? currentReturnTo());
  if (target === "/") {
    return "/login";
  }
  return `/login?returnTo=${encodeURIComponent(target)}`;
}

export function useRequireAuth() {
  const { isLoggedIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const requireAuth = useCallback(
    (returnTo?: string): boolean => {
      if (isLoading) {
        return false;
      }
      if (isLoggedIn) {
        return true;
      }
      setLocation(loginPathWithReturn(returnTo));
      return false;
    },
    [isLoggedIn, isLoading, setLocation],
  );

  return { requireAuth, isLoggedIn, isLoading };
}
