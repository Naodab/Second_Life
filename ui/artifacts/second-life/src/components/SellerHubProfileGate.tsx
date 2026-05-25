import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { loginPathWithReturn, sanitizeReturnTo } from "@/hooks/use-require-auth";

/** Chặn /manage khi hồ sơ chưa đủ họ, tên, email, SĐT. */
export function SellerHubProfileGate() {
  const { isLoggedIn, isLoading, sellerHubProfileComplete } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || !isLoggedIn) {
      return;
    }
    if (!location.startsWith("/manage")) {
      return;
    }
    if (sellerHubProfileComplete) {
      return;
    }
    if (location === "/profile/setup") {
      return;
    }
    const returnTo = sanitizeReturnTo(location);
    setLocation(`/profile/setup?returnTo=${encodeURIComponent(returnTo)}`);
  }, [isLoading, isLoggedIn, sellerHubProfileComplete, location, setLocation]);

  return null;
}

/** Trước khi điều hướng vào seller hub từ menu — tránh flash rồi mới redirect. */
export function guardSellerHubNavigation(
  targetPath: string,
  ctx: { isLoggedIn: boolean; sellerHubProfileComplete: boolean },
  setLocation: (path: string) => void,
): boolean {
  if (!ctx.isLoggedIn) {
    setLocation(loginPathWithReturn(targetPath));
    return false;
  }
  if (!ctx.sellerHubProfileComplete) {
    setLocation(`/profile/setup?returnTo=${encodeURIComponent(sanitizeReturnTo(targetPath))}`);
    return false;
  }
  return true;
}
