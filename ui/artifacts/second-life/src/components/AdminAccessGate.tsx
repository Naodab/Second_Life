import { useEffect } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/context/AuthContext";
import {
  adminRedirectForRestrictedPath,
  isAdminMarketplaceRestrictedPath,
} from "@/lib/admin-access";

/** Redirects admin away from seller hub, cart, checkout, orders, and messages. */
export function AdminAccessGate() {
  const { isLoggedIn, isLoading, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || !isLoggedIn || !isAdmin) {
      return;
    }
    if (!isAdminMarketplaceRestrictedPath(location)) {
      return;
    }
    setLocation(adminRedirectForRestrictedPath(location), { replace: true });
  }, [isLoading, isLoggedIn, isAdmin, location, setLocation]);

  return null;
}
