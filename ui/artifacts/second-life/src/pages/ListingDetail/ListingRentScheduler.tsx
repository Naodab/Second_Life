"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DateRange } from "react-day-picker";
import type { RentUnit } from "@/api/listing";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addHours, format, startOfDay } from "date-fns";

import {
  billableRentUnits,
  intervalHasCapacity,
  overlapBookedQty,
  rentUnitLabelVu,
  stepMsForRentUnit,
} from "./rent-schedule-utils";

import type { BookingInterval } from "./rent-schedule-utils";

export type RentScheduleWindow = { startMs: number; endExclusiveMs: number };

export type RentScheduleValidityPayload =
  | { ok: false; billUnits: 0; error?: string }
  | { ok: true; billUnits: number; hint?: string | null };

type Props = {
  rentUnit: RentUnit;
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

  const [hourDay, setHourDay] = useState<Date>(() => startOfDay(new Date()));
  const [hourStartBoundary, setHourStartBoundary] = useState<number | null>(null);

  const [calRange, setCalRange] = useState<DateRange | undefined>();

  useEffect(() => {
    setHourDay(startOfDay(new Date()));
    setHourStartBoundary(null);
    setCalRange(undefined);
    onWindowChange(null);
    onValidityChange({ ok: false, billUnits: 0 });
  }, [resetKey, onValidityChange, onWindowChange]);

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
      const step =
        rentUnit === "HOUR" ? 3600000 : rentUnit === "WEEK" ? 86400000 : Math.min(stepBase, 86400000);
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
      let hint: string | null = null;
      if (rentUnit === "WEEK") {
        const days = Math.round((win.endExclusiveMs - win.startMs) / 86400000);
        if (days % 7 !== 0)
          hint = `Đơn vị là tuần — nên chọn khoảng bội số 7 ngày (${rentUnitLabelVu("WEEK")}).`;
      }
      onValidityChange({ ok: true, billUnits: bill, hint });
    },
    [bookings, cap, onValidityChange, rentQty, rentUnit, stepBase],
  );

  const applyWindow = useCallback(
    (win: RentScheduleWindow | null) => {
      onWindowChange(win);
      runValidation(win);
    },
    [onWindowChange, runValidation],
  );

  useEffect(() => {
    runValidation(parentWindowPayload);
  }, [parentWindowPayload, rentQty, bookings, cap, rentUnit, runValidation]);

  const dayStartMs = useMemo(() => startOfDay(hourDay).getTime(), [hourDay]);
  const hours = useMemo(() => [...Array(24).keys()], []);

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

  const calendarDisabledMatcher = useCallback(
    (date: Date) => {
      if (cap <= 0) return true;
      const d0 = startOfDay(date).getTime();
      const d1 = d0 + 86400000;
      const overlap = overlapBookedQty(bookings, d0, d1);
      const q = Math.max(1, rentQty);
      return overlap + q > Math.max(1, cap);
    },
    [bookings, cap, rentQty],
  );

  const calendarBookedModifiers = useCallback(
    (date: Date) => {
      const d0 = startOfDay(date).getTime();
      const d1 = d0 + 86400000;
      return overlapBookedQty(bookings, d0, d1) > 0;
    },
    [bookings],
  );

  useEffect(() => {
    if (rentUnit === "HOUR") return;

    const from = calRange?.from;
    const to = calRange?.to ?? calRange?.from;
    if (!from || !to) {
      applyWindow(null);
      return;
    }

    const startMs = startOfDay(from).getTime();
    const endExclusive = startOfDay(to).getTime() + 86400000;

    if (!(endExclusive > startMs)) {
      applyWindow(null);
      return;
    }

    applyWindow({ startMs, endExclusiveMs: endExclusive });
  }, [applyWindow, calRange, rentUnit]);

  if (rentUnit === "HOUR") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold mb-2 text-foreground">Chọn ngày</p>
          <input
            type="date"
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none",
              "border-border/70 focus-visible:ring-[3px] focus-visible:ring-ring/55",
            )}
            min={format(startOfDay(new Date()), "yyyy-MM-dd")}
            value={format(hourDay, "yyyy-MM-dd")}
            onChange={(ev) => {
              const raw = ev.target.value;
              if (!raw) return;
              const d = startOfDay(new Date(`${raw}T12:00:00`));
              setHourDay(d);
              setHourStartBoundary(null);
              applyWindow(null);
            }}
          />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2 text-foreground flex flex-wrap gap-x-2 gap-y-1">
            <span>Chọn khung giờ</span>
            <span className="text-muted-foreground font-normal">(Đơn vị: giờ — chọn ô bắt đầu, chọn ô kết để cố định)</span>
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {hours.map((h) => {
              const cellStart = addHours(dayStartMs, h).getTime();
              const cellEnd = cellStart + 3600000;
              const insufficient = hourSlotInsufficient(bookings, cellStart, cellEnd, cap, rentQty);

              let inDraftRange = false;
              if (hourStartBoundary !== null) {
                inDraftRange = h === hourStartBoundary;
              }

              const label = `${String(h).padStart(2, "0")}:00`;

              return (
                <button
                  key={h}
                  type="button"
                  disabled={insufficient || cap <= 0}
                  onClick={() => onHourClick(h)}
                  title={insufficient ? "Không khả dụng" : `Từ ${label}`}
                  className={cn(
                    "rounded-lg border px-1 py-2 text-xs tabular-nums transition-colors disabled:opacity-35 disabled:pointer-events-none",
                    "border-border/80 bg-muted/20 hover:bg-accent/70",
                    inDraftRange && "ring-2 ring-secondary border-secondary bg-secondary/25",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Slot <span className="font-medium text-destructive/90">đã được đặt</span>: ô bị mờ. Chọn ô trống làm điểm bắt đầu, chọn ô kết&nbsp;≤
            điểm bắt để cố định khoảng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-2 text-foreground flex flex-wrap items-baseline gap-2">
          <span>Chọn khoảng thời gian</span>
          <span className="text-muted-foreground font-normal text-xs">Đơn vị nhỏ nhất ({rentUnitLabelVu(rentUnit)})</span>
        </p>

        <div className="rounded-2xl border border-border/60 bg-muted/10 p-2 flex justify-center">
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={calRange}
            onSelect={(r) => {
              setCalRange(r ?? undefined);
            }}
            disabled={calendarDisabledMatcher}
            modifiers={{ booked_day: calendarBookedModifiers }}
            modifiersClassNames={{
              booked_day: "bg-muted/80 text-muted-foreground line-through opacity-70 [&_button]:opacity-95",
            }}
          />
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
