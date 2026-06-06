export type JwtRole = "ADMIN" | "USER" | (string & {});

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function decodeJwtPayloadUnsafe(token: string): {
  sub?: string;
  profileId?: string;
  role?: JwtRole;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    const json = atob(base64);
    return JSON.parse(json) as { sub?: string; profileId?: string; role?: JwtRole };
  } catch {
    return null;
  }
}
