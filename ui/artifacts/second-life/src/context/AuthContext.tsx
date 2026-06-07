import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { decodeJwtPayloadUnsafe, isAdminRole } from "@/lib/jwtPayload";
import {
  ApiError,
  login as apiLogin,
  refreshToken as apiRefreshToken,
  getCurrentProfile,
  getProfileById,
  profileNeedsSetup,
  resolveProfileSetupFlags,
  type ProfilePayload,
} from "@/api";

const authCookieBase = { path: "/", sameSite: "lax" as const };

function userFromAccessToken(accessToken: string): User | null {
  const payload = decodeJwtPayloadUnsafe(accessToken);
  const email = payload?.sub;
  if (!email) {
    return null;
  }
  const profileId = payload?.profileId ?? "";
  return {
    id: profileId,
    name: email.split("@")[0] || email,
    email,
    avatar: null,
    firstName: null,
    lastName: null,
  };
}

function userFromProfile(profile: ProfilePayload): User {
  const first = profile.firstName?.trim() ?? "";
  const last = profile.lastName?.trim() ?? "";
  const displayName = [first, last].filter(Boolean).join(" ").trim();
  return {
    id: profile.id,
    name: displayName || profile.email.split("@")[0] || profile.email,
    email: profile.email,
    avatar: profile.avatarUrl || null,
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  firstName: string | null;
  lastName: string | null;
}

export class UnverifiedEmailError extends Error {
  constructor() {
    super("UNVERIFIED_EMAIL");
    this.name = "UnverifiedEmailError";
    Object.setPrototypeOf(this, UnverifiedEmailError.prototype);
  }
}

function readIsAdminFromToken(token: string | undefined): boolean {
  if (!token?.trim()) {
    return false;
  }
  const payload = decodeJwtPayloadUnsafe(token);
  return isAdminRole(payload?.role);
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  needsProfileSetup: boolean;
  sellerHubProfileComplete: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (accessToken: string, refreshToken: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshSessionProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentProfileWithRetry(
  maxAttempts = 24,
  delayMs = 250,
): Promise<ProfilePayload> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await getCurrentProfile();
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status === 404 && i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function loadProfileForAccessToken(accessToken: string): Promise<ProfilePayload> {
  const payload = decodeJwtPayloadUnsafe(accessToken);
  const profileId = payload?.profileId?.trim();
  if (profileId) {
    return getProfileById(profileId);
  }
  return fetchCurrentProfileWithRetry();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [sellerHubProfileComplete, setSellerHubProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncAdminFromCookie = useCallback(() => {
    setIsAdmin(readIsAdminFromToken(Cookies.get("accessToken")));
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => Cookies.get("accessToken") || null);
  }, []);

  const applyProfile = useCallback((profile: ProfilePayload) => {
    const admin = readIsAdminFromToken(Cookies.get("accessToken"));
    const flags = resolveProfileSetupFlags(profile, admin);
    setUser(userFromProfile(profile));
    setNeedsProfileSetup(flags.needsProfileSetup);
    setSellerHubProfileComplete(flags.sellerHubProfileComplete);
  }, []);

  const applyAdminSessionFromToken = useCallback((accessToken: string) => {
    const fromJwt = userFromAccessToken(accessToken);
    if (!fromJwt) {
      return false;
    }
    setUser(fromJwt);
    setIsAdmin(true);
    setNeedsProfileSetup(false);
    setSellerHubProfileComplete(false);
    return true;
  }, []);

  const refreshTokenAndFetchUser = async () => {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      try {
        const { accessToken, refreshToken: newRefreshToken } = await apiRefreshToken({ refreshToken });
        Cookies.set("accessToken", accessToken, { ...authCookieBase, expires: 1 });
        Cookies.set("refreshToken", newRefreshToken, { ...authCookieBase, expires: 7 });
        if (readIsAdminFromToken(accessToken)) {
          if (!applyAdminSessionFromToken(accessToken)) {
            throw new Error("Admin token missing subject");
          }
        } else {
          const profile = await loadProfileForAccessToken(accessToken);
          applyProfile(profile);
          setIsAdmin(false);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        Cookies.remove("accessToken", authCookieBase);
        Cookies.remove("refreshToken", authCookieBase);
        setUser(null);
        setIsAdmin(false);
        setNeedsProfileSetup(false);
        setSellerHubProfileComplete(false);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("accessToken");
      if (token) {
        const admin = readIsAdminFromToken(token);
        if (admin) {
          applyAdminSessionFromToken(token);
        } else {
          try {
            const profile = await loadProfileForAccessToken(token);
            applyProfile(profile);
          } catch (error) {
            console.error("Failed to fetch profile with existing token:", error);
            const fallback = userFromAccessToken(token);
            if (fallback) {
              setUser(fallback);
              setIsAdmin(false);
              setNeedsProfileSetup(true);
              setSellerHubProfileComplete(false);
            } else {
              await refreshTokenAndFetchUser();
            }
          }
        }
      }
      syncAdminFromCookie();
      setIsLoading(false);
    };

    void checkAuth();
  }, [applyAdminSessionFromToken, applyProfile, syncAdminFromCookie]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { accessToken, refreshToken, profile } = await apiLogin({ email, password });

    if (!accessToken?.trim()) {
      throw new UnverifiedEmailError();
    }

    Cookies.set("accessToken", accessToken, { ...authCookieBase, expires: 1 });
    Cookies.set("refreshToken", refreshToken, { ...authCookieBase, expires: 7 });

    const admin = readIsAdminFromToken(accessToken);

    if (admin) {
      if (!applyAdminSessionFromToken(accessToken)) {
        throw new Error("Login response missing admin identity");
      }
      return false;
    }

    if (!profile) {
      throw new Error("Login response missing profile");
    }

    applyProfile(profile as ProfilePayload);
    setIsAdmin(false);
    return profileNeedsSetup(profile as ProfilePayload);
  };

  const loginWithGoogle = useCallback(
    async (accessToken: string, refreshToken: string): Promise<boolean> => {
      Cookies.set("accessToken", accessToken, { ...authCookieBase, expires: 1 });
      Cookies.set("refreshToken", refreshToken, { ...authCookieBase, expires: 7 });

      if (readIsAdminFromToken(accessToken)) {
        if (!applyAdminSessionFromToken(accessToken)) {
          throw new Error("OAuth token missing admin identity");
        }
        return false;
      }

      try {
        const profile = await loadProfileForAccessToken(accessToken);
        applyProfile(profile);
        setIsAdmin(false);
        return profileNeedsSetup(profile);
      } catch (profileErr) {
        console.warn("Profile fetch after OAuth failed, using JWT claims:", profileErr);
        const fromJwt = userFromAccessToken(accessToken);
        if (!fromJwt) {
          throw profileErr;
        }
        setUser(fromJwt);
        setIsAdmin(false);
        setNeedsProfileSetup(true);
        setSellerHubProfileComplete(false);
        return true;
      }
    },
    [applyAdminSessionFromToken, applyProfile],
  );

  const refreshSessionProfile = useCallback(async () => {
    const token = Cookies.get("accessToken");
    if (!token || readIsAdminFromToken(token)) {
      return;
    }
    const profile = await loadProfileForAccessToken(token);
    applyProfile(profile);
  }, [applyProfile]);

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    setNeedsProfileSetup(false);
    setSellerHubProfileComplete(false);
    Cookies.remove("accessToken", authCookieBase);
    Cookies.remove("refreshToken", authCookieBase);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        needsProfileSetup,
        sellerHubProfileComplete,
        login,
        loginWithGoogle,
        logout,
        isLoading,
        refreshSessionProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
