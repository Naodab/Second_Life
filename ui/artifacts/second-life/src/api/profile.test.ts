import { describe, expect, it } from "vitest";

import {
  profileIsCompleteForSellerHub,
  profileNeedsSetup,
  resolveProfileSetupFlags,
  type ProfilePayload,
} from "./profile";

const incompleteProfile: ProfilePayload = {
  id: "p1",
  email: "user@example.com",
  firstName: null,
  lastName: null,
  phoneNumber: null,
};

const completeUserProfile: ProfilePayload = {
  id: "p2",
  email: "seller@example.com",
  firstName: "An",
  lastName: "Nguyen",
  phoneNumber: "0901234567",
};

describe("profile setup helpers", () => {
  describe("profileNeedsSetup", () => {
    it("returns true when firstName is missing", () => {
      expect(profileNeedsSetup(incompleteProfile)).toBe(true);
      expect(profileNeedsSetup({ ...incompleteProfile, firstName: "  " })).toBe(true);
    });

    it("returns false when firstName is present", () => {
      expect(profileNeedsSetup({ ...incompleteProfile, firstName: "An" })).toBe(false);
    });
  });

  describe("profileIsCompleteForSellerHub", () => {
    it("returns false when seller hub fields are incomplete", () => {
      expect(profileIsCompleteForSellerHub(incompleteProfile)).toBe(false);
      expect(
        profileIsCompleteForSellerHub({
          ...completeUserProfile,
          phoneNumber: "123",
        }),
      ).toBe(false);
    });

    it("returns true when all seller hub fields are valid", () => {
      expect(profileIsCompleteForSellerHub(completeUserProfile)).toBe(true);
    });
  });

  describe("resolveProfileSetupFlags", () => {
    it("bypasses profile checks for admin even with incomplete profile", () => {
      expect(resolveProfileSetupFlags(incompleteProfile, true)).toEqual({
        needsProfileSetup: false,
        sellerHubProfileComplete: true,
      });
    });

    it("requires setup for regular users with incomplete profile", () => {
      expect(resolveProfileSetupFlags(incompleteProfile, false)).toEqual({
        needsProfileSetup: true,
        sellerHubProfileComplete: false,
      });
    });

    it("marks seller hub complete for regular users with full profile", () => {
      expect(resolveProfileSetupFlags(completeUserProfile, false)).toEqual({
        needsProfileSetup: false,
        sellerHubProfileComplete: true,
      });
    });
  });
});
