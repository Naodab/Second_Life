import type { RentUnit } from "@/api/listing";

export const SELECTABLE_RENT_UNIT_OPTIONS: { value: RentUnit; label: string }[] = [
  { value: "HOUR", label: "Mỗi giờ" },
  { value: "DAY", label: "Mỗi ngày" },
];

const SELECTABLE_RENT_UNIT_SET = new Set<RentUnit>(SELECTABLE_RENT_UNIT_OPTIONS.map((o) => o.value));

export function isSelectableRentUnit(unit: RentUnit | null | undefined): unit is RentUnit {
  return Boolean(unit && SELECTABLE_RENT_UNIT_SET.has(unit));
}

/** Maps legacy MONTH listings to DAY for scheduling and display. */
export function normalizeRentUnitForUi(unit: RentUnit | null | undefined): RentUnit {
  if (!unit || unit === "MONTH") return "DAY";
  return unit;
}
