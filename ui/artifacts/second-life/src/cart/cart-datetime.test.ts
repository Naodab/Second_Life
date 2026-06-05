import { describe, expect, it } from "vitest";

import { toApiDateTime } from "./cart-datetime";

describe("toApiDateTime", () => {
  it("formats without timezone suffix", () => {
    const value = new Date(2026, 5, 10, 8, 5, 7);
    expect(toApiDateTime(value)).toBe("2026-06-10T08:05:07");
  });
});
