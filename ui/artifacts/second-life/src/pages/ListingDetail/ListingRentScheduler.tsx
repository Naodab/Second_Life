"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarDays, Leaf } from "lucide-react";
import type { RentUnit } from "@/api/listing";
import { cn } from "@/lib/utils";
import { addHours, addMonths, format, startOfDay, startOfMonth } from "date-fns";

import {
  billableRentUnits,
  intervalHasCapacity,
  overlapBookedQty,
  stepMsForRentUnit,
} from "./rent-schedule-utils";

import type { BookingInterval } from "./rent-schedule-utils";

export type RentScheduleWindow = { startMs: number; endExclusiveMs: number };

export type RentScheduleValidityPayload =
  | { ok: false; billUnits: 0; error?: string }
  | { ok: true; billUnits: number; hint?: string | null };

const MONTH_SHORT = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"] as const;

type Props = {
  rentUnit: RentUnit;
  scheduleResourceLabel?: string;
  hourDay?: Date;
  onHourDayChange?: (day: Date) => void;
  bookings: BookingInterval[];
  concurrencyCap: number;
  rentQty: number;
  resetKey: string;
  parentWindow: RentScheduleWindow | null;
  onWindowChange: (win: RentScheduleWindow | null) => void;
  onValidityChange: (payload: RentScheduleValidityPayload) => void;
};

function hourSlotInsufficient(
  bookings: BookingInterval[],
  hourStartMs: number,
  hourEndMs: number,
  cap: number,
  qty: number,
): boolean {
  const c = Math.max(1, cap);
  const q = Math.max(1, qty);
  return overlapBookedQty(bookings, hourStartMs, hourEndMs) + q > c;
}

export function ListingRentScheduler({
  rentUnit,
  scheduleResourceLabel = "Khung thuê",
  hourDay: hourDayProp,
  onHourDayChange,
  bookings,
  concurrencyCap,
  rentQty,
  resetKey,
  parentWindow: parentWindowPayload,
  onWindowChange,
  onValidityChange,
}: Props) {
  const cap = Math.max(0, Math.floor(concurrencyCap));
  const stepBase = stepMsForRentUnit(rentUnit);
  const scheduleDayUnit = rentUnit === "WEEK" ? "DAY" : rentUnit;

  const hourDayControlled = hourDayProp !== undefined && onHourDayChange !== undefined;
  const [hourDayInternal, setHourDayInternal] = useState<Date>(() => startOfDay(new Date()));
  const hourDay = hourDayControlled ? startOfDay(hourDayProp) : hourDayInternal;
  const setHourDay = useCallback(
    (d: Date) => {
      const sd = startOfDay(d);
      if (hourDayControlled && onHourDayChange) {
        onHourDayChange(sd);
      } else {
        setHourDayInternal(sd);
      }
    },
    [hourDayControlled, onHourDayChange],
  );

  const [hourStartBoundary, setHourStartBoundary] = useState<number | null>(null);

  const [dayStartStr, setDayStartStr] = useState("");
  const [dayEndStr, setDayEndStr] = useState("");

  const [rentYear, setRentYear] = useState<number>(() => new Date().getFullYear());
  const [monthStartBoundary, setMonthStartBoundary] = useState<number | null>(null);

  useEffect(() => {
    if (!hourDayControlled) {
      setHourDayInternal(startOfDay(new Date()));
    }
    setHourStartBoundary(null);
    setDayStartStr("");
    setDayEndStr("");
    setRentYear(new Date().getFullYear());
    setMonthStartBoundary(null);
    onWindowChange(null);
    onValidityChange({ ok: false, billUnits: 0 });
  }, [resetKey, hourDayControlled, onValidityChange, onWindowChange]);

  const runValidation = useCallback(
    (win: RentScheduleWindow | null) => {
      if (!win || !(win.endExclusiveMs > win.startMs)) {
        onValidityChange({ ok: false, billUnits: 0 });
        return;
      }
      if (cap <= 0) {
        onValidityChange({ ok: false, billUnits: 0, error: "Hết chỗ trong kho." });
        return;
      }
      const step = scheduleDayUnit === "HOUR" ? 3600000 : Math.min(stepBase, 86400000);
      const ok = intervalHasCapacity(bookings, win.startMs, win.endExclusiveMs, cap, rentQty, step);
      if (!ok) {
        onValidityChange({
          ok: false,
          billUnits: 0,
          error: "Khung thời gian trùng với các slot đã đặt (hoặc số lượng thuê vượt khả năng còn lại trong kho).",
        });
        return;
      }
      const bill = billableRentUnits(rentUnit, win.startMs, win.endExclusiveMs);
      onValidityChange({ ok: true, billUnits: bill, hint: null });
    },
    [bookings, cap, onValidityChange, rentQty, rentUnit, scheduleDayUnit, stepBase],
  );

  const applyWindow = useCallback(
    (win: RentScheduleWindow | null) => {
      onWindowChange(win);
      runValidation(win);
    },
    [onWindowChange, runValidation],
  );

  const prevHourDayMsRef = useRef<number | null>(null);
  useEffect(() => {
    if (rentUnit !== "HOUR") {
      prevHourDayMsRef.current = null;
      return;
    }
    const current = startOfDay(hourDay).getTime();
    const prev = prevHourDayMsRef.current;
    prevHourDayMsRef.current = current;
    if (prev === null) return;
    if (prev === current) return;
    setHourStartBoundary(null);
    applyWindow(null);
  }, [hourDay, rentUnit, applyWindow]);

  useEffect(() => {
    runValidation(parentWindowPayload);
  }, [parentWindowPayload, rentQty, bookings, cap, rentUnit, runValidation]);

  useEffect(() => {
    if (scheduleDayUnit !== "DAY") return;

    if (!dayStartStr || !dayEndStr) {
      applyWindow(null);
      return;
    }

    const from = startOfDay(new Date(`${dayStartStr}T12:00:00`));
    const to = startOfDay(new Date(`${dayEndStr}T12:00:00`));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      applyWindow(null);
      return;
    }

    const startMs = from.getTime();
    const endExclusive = to.getTime() + 86400000;

    if (!(endExclusive > startMs)) {
      applyWindow(null);
      return;
    }

    applyWindow({ startMs, endExclusiveMs: endExclusive });
  }, [applyWindow, dayEndStr, dayStartStr, scheduleDayUnit]);

  const dayStartMs = useMemo(() => startOfDay(hourDay).getTime(), [hourDay]);
  const hours = useMemo(() => [...Array(24).keys()], []);

  const isHourInConfirmedRange = useCallback(
    (h: number) => {
      const w = parentWindowPayload;
      if (!w) return false;
      if (startOfDay(new Date(w.startMs)).getTime() !== dayStartMs) return false;
      const cellStart = addHours(dayStartMs, h).getTime();
      const cellEnd = cellStart + 3600000;
      return cellStart < w.endExclusiveMs && cellEnd > w.startMs;
    },
    [parentWindowPayload, dayStartMs],
  );

  const onHourClick = useCallback(
    (h: number) => {
      const cellStart = addHours(dayStartMs, h).getTime();
      const cellEnd = cellStart + 3600000;

      const blockedPick = hourSlotInsufficient(bookings, cellStart, cellEnd, cap, rentQty);

      if (hourStartBoundary === null) {
        if (blockedPick) return;
        setHourStartBoundary(h);
        applyWindow(null);
        return;
      }

      if (h < hourStartBoundary) {
        if (blockedPick) return;
        setHourStartBoundary(h);
        applyWindow(null);
        return;
      }

      if (h === hourStartBoundary) {
        const startMs = addHours(dayStartMs, hourStartBoundary).getTime();
        const endExclusive = startMs + 3600000;
        setHourStartBoundary(null);
        applyWindow({ startMs, endExclusiveMs: endExclusive });
        return;
      }

      const startMs = addHours(dayStartMs, hourStartBoundary).getTime();
      const endExclusive = addHours(dayStartMs, h + 1).getTime();
      if (!(endExclusive > startMs)) return;
      for (let k = hourStartBoundary; k <= h; k++) {
        const s = addHours(dayStartMs, k).getTime();
        const e = s + 3600000;
        if (hourSlotInsufficient(bookings, s, e, cap, rentQty)) {
          return;
        }
      }
      setHourStartBoundary(null);
      applyWindow({ startMs, endExclusiveMs: endExclusive });
    },
    [applyWindow, bookings, cap, dayStartMs, hourStartBoundary, rentQty],
  );

  const onMonthIndexClick = useCallback(
    (monthIdx: number) => {
      if (monthStartBoundary === null) {
        setMonthStartBoundary(monthIdx);
        applyWindow(null);
        return;
      }

      if (monthIdx < monthStartBoundary) {
        setMonthStartBoundary(monthIdx);
        applyWindow(null);
        return;
      }

      if (monthIdx === monthStartBoundary) {
        const startMs = startOfMonth(new Date(rentYear, monthIdx, 1)).getTime();
        const endExclusive = addMonths(startOfMonth(new Date(rentYear, monthIdx, 1)), 1).getTime();
        if (!intervalHasCapacity(bookings, startMs, endExclusive, cap, rentQty, 86400000)) return;
        setMonthStartBoundary(null);
        applyWindow({ startMs, endExclusiveMs: endExclusive });
        return;
      }

      const lo = Math.min(monthStartBoundary, monthIdx);
      const hi = Math.max(monthStartBoundary, monthIdx);
      const startMs = startOfMonth(new Date(rentYear, lo, 1)).getTime();
      const endExclusive = addMonths(startOfMonth(new Date(rentYear, hi, 1)), 1).getTime();

      if (!intervalHasCapacity(bookings, startMs, endExclusive, cap, rentQty, 86400000)) return;
      setMonthStartBoundary(null);
      applyWindow({ startMs, endExclusiveMs: endExclusive });
    },
    [applyWindow, bookings, cap, monthStartBoundary, rentQty, rentYear],
  );

  const isMonthIndexInConfirmedRange = useCallback(
    (idx: number) => {
      const w = parentWindowPayload;
      if (!w || rentUnit !== "MONTH") return false;
      const start = new Date(w.startMs);
      if (start.getFullYear() !== rentYear) return false;
      const lastInclusive = new Date(w.endExclusiveMs - 1);
      if (lastInclusive.getFullYear() !== rentYear) return false;
      const lo = start.getMonth();
      const hi = lastInclusive.getMonth();
      return idx >= lo && idx <= hi;
    },
    [parentWindowPayload, rentUnit, rentYear],
  );

  if (rentUnit === "HOUR") {
    const hourStripLabel = scheduleResourceLabel.trim() || "Khung chọn giờ thuê";

    return (
      <div className="space-y-1.5">
        <div className="isolate min-w-0 max-w-full overflow-hidden rounded-2xl border border-sky-200/50 bg-gradient-to-b from-sky-50/90 to-background shadow-inner dark:border-sky-900/40 dark:from-sky-950/30 dark:to-card">
          <div
            className="hide-scrollbar max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]"
            role="region"
            aria-label={hourStripLabel}
          >
            <div className="inline-flex min-w-max flex-col">
              <div className="flex shrink-0 border-b border-sky-200/70 px-4 dark:border-sky-800/60">
                {hours.map((h) => (
                  <div
                    key={`h-${h}`}
                    className={cn(
                      "relative h-12 w-[3.35rem] shrink-0 border-l border-sky-200/60 bg-sky-100/90 dark:border-sky-800/50 dark:bg-sky-950/45",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute left-0 top-2 z-[4] -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold tabular-nums text-sky-950 dark:text-sky-100",
                      )}
                    >
                      {String(h).padStart(2, "0")}:00
                    </span>
                    <span
                      className="pointer-events-none absolute left-0 bottom-1.5 z-[4] h-2 w-0.5 -translate-x-1/2 rounded-full bg-orange-500/90"
                      aria-hidden
                    />
                    {h === 23 ? (
                      <>
                        <span className="pointer-events-none absolute right-0 top-2 z-[4] translate-x-1/2 whitespace-nowrap text-[12px] font-semibold tabular-nums text-sky-950 dark:text-sky-100">
                          24:00
                        </span>
                        <span
                          className="pointer-events-none absolute right-0 bottom-1.5 z-[4] h-2 w-0.5 translate-x-1/2 rounded-full bg-orange-500/90"
                          aria-hidden
                        />
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 bg-background px-4 dark:bg-card">
                {hours.map((h) => {
                  const cellStart = addHours(dayStartMs, h).getTime();
                  const cellEnd = cellStart + 3600000;
                  const insufficient = hourSlotInsufficient(bookings, cellStart, cellEnd, cap, rentQty);
                  const draftStart = hourStartBoundary === h;
                  const inRange = isHourInConfirmedRange(h);
                  const label = `${String(h).padStart(2, "0")}:00 — ${String(h + 1).padStart(2, "0")}:00`;

                  const cellClass = cn(
                    "flex h-[3.25rem] w-[3.35rem] shrink-0 items-stretch border-l border-border/35",
                    insufficient && "bg-muted-foreground/25 dark:bg-muted-foreground/35",
                    !insufficient && inRange && "bg-emerald-400/25 dark:bg-emerald-600/25",
                    !insufficient && !inRange && "bg-background dark:bg-card",
                  );

                  if (insufficient) {
                    return (
                      <div
                        key={`c-${h}`}
                        className={cellClass}
                        title="Đã có người đặt / không khả dụng"
                        aria-disabled
                      />
                    );
                  }

                  return (
                    <div key={`c-${h}`} className={cellClass}>
                      <button
                        type="button"
                        onClick={() => onHourClick(h)}
                        title={label}
                        className={cn(
                          "m-0.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-sm border border-transparent transition-colors hover:bg-accent/60",
                          draftStart && "ring-2 ring-inset ring-orange-500",
                        )}
                      >
                        {(inRange || draftStart) && (
                          <Leaf
                            className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rentUnit === "MONTH") {
    return (
      <div className="space-y-3">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-background shadow-inner dark:border-border/45 dark:from-muted/15 dark:to-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-3 dark:border-border/35">
            <span className="text-sm font-medium text-muted-foreground">Năm</span>
            <input
              type="number"
              className={cn(
                "h-10 w-28 rounded-xl border-2 bg-muted/30 px-3 text-base font-bold tabular-nums outline-none",
                "border-border/50 shadow-sm transition-colors",
                "hover:border-border/80",
                "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:bg-muted/20",
              )}
              min={2000}
              max={2100}
              value={rentYear}
              onChange={(ev) => {
                const v = Number(ev.target.value);
                if (!Number.isFinite(v)) return;
                setRentYear(Math.min(2100, Math.max(2000, Math.floor(v))));
                setMonthStartBoundary(null);
                applyWindow(null);
              }}
            />
          </div>
          <div className="hide-scrollbar max-w-full overflow-x-auto overscroll-x-contain px-3 pb-4 pt-3 touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-max border-separate border-spacing-1 text-sm sm:text-base">
              <tbody>
                <tr>
                  {MONTH_SHORT.map((label, idx) => {
                    const inDraft = monthStartBoundary === idx;
                    const inConfirmed = isMonthIndexInConfirmedRange(idx);
                    return (
                      <td key={label} className="p-0 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => onMonthIndexClick(idx)}
                          title={label}
                          className={cn(
                            "flex min-h-[3rem] w-full min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-sm font-medium transition-colors disabled:opacity-35 disabled:pointer-events-none sm:min-h-[3.25rem] sm:min-w-[3.75rem] sm:text-base",
                            "border-border/70 bg-muted/20 hover:bg-accent/70",
                            inDraft && "ring-2 ring-inset ring-orange-500 border-orange-500/50 bg-orange-500/10",
                            inConfirmed &&
                            !inDraft &&
                            "border-emerald-600/35 bg-emerald-400/20 dark:border-emerald-500/40 dark:bg-emerald-600/20",
                          )}
                        >
                          <span>{label}</span>
                          {(inDraft || inConfirmed) && (
                            <Leaf
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                inDraft ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400",
                              )}
                              aria-hidden
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");

  return (
    <div className="space-y-3">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/30 to-background p-4 shadow-inner sm:p-5 dark:border-border/45 dark:from-muted/15 dark:to-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="rent-day-start" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              Ngày bắt đầu
            </label>
            <div className="relative">
              <input
                id="rent-day-start"
                type="date"
                min={todayStr}
                className={cn(
                  "h-11 w-full min-w-0 rounded-xl border-2 bg-muted/30 px-4 text-sm font-medium tabular-nums outline-none",
                  "border-border/50 shadow-sm transition-colors",
                  "hover:border-border/80",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:bg-muted/20",
                  dayStartStr ? "text-foreground" : "text-muted-foreground",
                )}
                value={dayStartStr}
                onChange={(ev) => setDayStartStr(ev.target.value)}
              />
              {dayStartStr && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/70" />
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="rent-day-end" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              Ngày kết thúc
            </label>
            <div className="relative">
              <input
                id="rent-day-end"
                type="date"
                min={dayStartStr || todayStr}
                className={cn(
                  "h-11 w-full min-w-0 rounded-xl border-2 bg-muted/30 px-4 text-sm font-medium tabular-nums outline-none",
                  "border-border/50 shadow-sm transition-colors",
                  "hover:border-border/80",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:bg-muted/20",
                  dayEndStr ? "text-foreground" : "text-muted-foreground",
                )}
                value={dayEndStr}
                onChange={(ev) => setDayEndStr(ev.target.value)}
              />
              {dayEndStr && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-secondary/70" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function rentalWindowToCartDates(win: RentScheduleWindow): { start: Date; end: Date } {
  return {
    start: new Date(win.startMs),
    end: new Date(win.endExclusiveMs - 60000),
  };
}
