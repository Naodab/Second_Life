import { describe, expect, it } from "vitest";
import {
  isSelectableRentUnit,
  normalizeRentUnitForUi,
  SELECTABLE_RENT_UNIT_OPTIONS,
} from "./rent-units";

describe("rent-units", () => {
  it("only exposes hourly and daily options", () => {
    expect(SELECTABLE_RENT_UNIT_OPTIONS.map((o) => o.value)).toEqual(["HOUR", "DAY"]);
  });

  it("rejects month from selectable units", () => {
    expect(isSelectableRentUnit("MONTH")).toBe(false);
    expect(isSelectableRentUnit("DAY")).toBe(true);
  });

  it("normalizes legacy month listings to day", () => {
    expect(normalizeRentUnitForUi("MONTH")).toBe("DAY");
    expect(normalizeRentUnitForUi("HOUR")).toBe("HOUR");
  });
});
