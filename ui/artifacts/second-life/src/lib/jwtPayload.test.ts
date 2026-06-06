import { describe, expect, it } from "vitest";

import { decodeJwtPayloadUnsafe, isAdminRole } from "./jwtPayload";

function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`;
}

describe("jwtPayload", () => {
  describe("isAdminRole", () => {
    it("returns true only for ADMIN", () => {
      expect(isAdminRole("ADMIN")).toBe(true);
      expect(isAdminRole("USER")).toBe(false);
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
      expect(isAdminRole("")).toBe(false);
    });
  });

  describe("decodeJwtPayloadUnsafe", () => {
    it("decodes sub, profileId and role from access token", () => {
      const token = fakeJwt({
        sub: "admin@example.com",
        profileId: "profile-1",
        role: "ADMIN",
      });
      expect(decodeJwtPayloadUnsafe(token)).toEqual({
        sub: "admin@example.com",
        profileId: "profile-1",
        role: "ADMIN",
      });
    });

    it("returns null for malformed tokens", () => {
      expect(decodeJwtPayloadUnsafe("not-a-jwt")).toBeNull();
      expect(decodeJwtPayloadUnsafe("only.one")).toBeNull();
    });
  });
});
