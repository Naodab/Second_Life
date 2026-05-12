import type { RentUnit } from "@/api/listing";
import { addDays, differenceInCalendarMonths, parseISO, startOfDay } from "date-fns";

import type { RentalPeriodDto } from "@/api/inventory";

export type BookingInterval = { startMs: number; endMs: number; qty: number };

function parseFlexibleLocal(dateStr: string): Date | null {
  const s = dateStr.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return parseISO(`${s}T12:00:00`);
  }
  const d = parseISO(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function rentalPeriodsToBookings(rows: RentalPeriodDto[]): BookingInterval[] {
  const out: BookingInterval[] = [];
  for (const p of rows) {
    const qty = typeof p.quantity === "number" && Number.isFinite(p.quantity) ? Math.max(1, Math.floor(p.quantity)) : 1;
    const ss = p.slotStart?.trim();
    const se = p.slotEnd?.trim();
    if (ss && se) {
      const start = parseFlexibleLocal(ss);
      const end = parseFlexibleLocal(se);
      const a = start?.getTime();
      const b = end?.getTime();
      if (typeof a === "number" && typeof b === "number" && b > a) {
        out.push({ startMs: a, endMs: b, qty });
      }
      continue;
    }
    const rs = p.rentalStart?.trim();
    const re = p.rentalEnd?.trim();
    if (!rs || !re) continue;
    const sd = parseFlexibleLocal(rs);
    const ed = parseFlexibleLocal(re);
    if (!sd || !ed) continue;
    const startMs = startOfDay(sd).getTime();
    const endExclusive = addDays(startOfDay(ed), 1).getTime();
    if (endExclusive > startMs) {
      out.push({ startMs, endMs: endExclusive, qty });
    }
  }
  return out;
}

export function overlapBookedQty(bookings: BookingInterval[], winStartMs: number, winEndMs: number): number {
  return bookings.reduce((acc, b) => {
    if (!(b.startMs < winEndMs && b.endMs > winStartMs)) return acc;
    return acc + b.qty;
  }, 0);
}

export function isHourSlotBlocked(
  bookings: BookingInterval[],
  hourStartMs: number,
  hourEndMs: number,
  concurrencyCap: number,
): boolean {
  return overlapBookedQty(bookings, hourStartMs, hourEndMs) >= Math.max(1, concurrencyCap);
}

export function isDayFullyBlocked(bookings: BookingInterval[], day: Date, concurrencyCap: number): boolean {
  const d0 = startOfDay(day).getTime();
  const d1 = addDays(d0, 1).getTime();
  return overlapBookedQty(bookings, d0, d1) >= Math.max(1, concurrencyCap);
}

export function intervalHasCapacity(
  bookings: BookingInterval[],
  rangeStartMs: number,
  rangeEndMs: number,
  concurrencyCap: number,
  requestedQty: number,
  stepMs: number,
): boolean {
  if (rangeEndMs <= rangeStartMs) return false;
  const cap = Math.max(1, concurrencyCap);
  const qty = Math.max(1, requestedQty);
  for (let t = rangeStartMs; t < rangeEndMs; t += stepMs) {
    const end = Math.min(t + stepMs, rangeEndMs);
    const used = overlapBookedQty(bookings, t, end);
    if (used + qty > cap) return false;
  }
  return true;
}

export function rentUnitLabelVu(unit: RentUnit | undefined | null): string {
  switch (unit) {
    case "HOUR":
      return "giờ";
    case "DAY":
      return "ngày";
    case "WEEK":
      return "tuần";
    case "MONTH":
      return "tháng";
    default:
      return "đơn vị";
  }
}

export function stepMsForRentUnit(unit: RentUnit): number {
  switch (unit) {
    case "HOUR":
      return 3600000;
    case "DAY":
      return 86400000;
    case "WEEK":
      return 7 * 86400000;
    case "MONTH":
      return 86400000;
    default:
      return 86400000;
  }
}

export function billableRentUnits(unit: RentUnit, startMs: number, endExclusiveMs: number): number {
  if (!(endExclusiveMs > startMs)) return 0;
  switch (unit) {
    case "HOUR":
      return Math.max(1, Math.ceil((endExclusiveMs - startMs) / (60 * 60 * 1000)));
    case "DAY":
      return Math.max(1, Math.round((endExclusiveMs - startMs) / (24 * 60 * 60 * 1000)));
    case "WEEK":
      return Math.max(1, Math.ceil((endExclusiveMs - startMs) / (7 * 86400000)));
    case "MONTH": {
      const a = startOfDay(new Date(startMs));
      const b = startOfDay(new Date(endExclusiveMs - 1));
      return Math.max(1, differenceInCalendarMonths(b, a) + 1);
    }
    default:
      return Math.max(1, Math.round((endExclusiveMs - startMs) / 86400000));
  }
}
