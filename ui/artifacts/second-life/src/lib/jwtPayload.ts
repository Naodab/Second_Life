/**
 * Decode JWT payload (no signature verification). Used when profile API is unavailable
 * or still provisioning after OAuth; claims match authservice JwtTokenProvider.
 */
export function decodeJwtPayloadUnsafe(token: string): {
  sub?: string;
  profileId?: string;
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
    return JSON.parse(json) as { sub?: string; profileId?: string };
  } catch {
    return null;
  }
}
