import { AlertCircle, CalendarDays, Minus, Plus } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import type { RentalPeriodDto } from "@/api/inventory";
import type { AttributeDto, RentUnit } from "@/api/listing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

import type { Product } from "@/lib/mock-data";
import { ListingVariantAttributePickers } from "./ListingVariantAttributePickers";

import type { RentScheduleValidityPayload } from "./ListingRentScheduler";
import { ListingRentScheduler, type RentScheduleWindow } from "./ListingRentScheduler";
import { rentalPeriodsToBookings, rentUnitLabelVu } from "./rent-schedule-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heroImageUrl: string;
  cartBridge: Product;
  variantAxes: AttributeDto[];
  variantSelection: Record<string, string>;
  onVariantSelectionChange: (axisKey: string, valueId: string) => void;
  rentUnit: RentUnit;
  lineStock: number;
  lineUnitRentPrice: number;
  rentQty: number;
  onRentQtyChange: (next: number) => void;
  rentWindow: RentScheduleWindow | null;
  onRentWindowChange: (w: RentScheduleWindow | null) => void;
  rentValidity: RentScheduleValidityPayload;
  onRentValidityChange: (p: RentScheduleValidityPayload) => void;
  rentalPeriods: RentalPeriodDto[];
  rentalsLoading: boolean;
  schedulerResetKey: string;
  checkoutDisabled: boolean;
  onCheckout: () => void;
};

export function ListingRentDialog({
  open,
  onOpenChange,
  heroImageUrl,
  cartBridge,
  variantAxes,
  variantSelection,
  onVariantSelectionChange,
  rentUnit,
  lineStock,
  lineUnitRentPrice,
  rentQty,
  onRentQtyChange,
  rentWindow,
  onRentWindowChange,
  rentValidity,
  onRentValidityChange,
  rentalPeriods,
  rentalsLoading,
  schedulerResetKey,
  checkoutDisabled,
  onCheckout,
}: Props) {
  const bookings = useMemo(() => rentalPeriodsToBookings(rentalPeriods), [rentalPeriods]);

  const [hourRentDay, setHourRentDay] = useState(() => startOfDay(new Date()));
  useEffect(() => {
    setHourRentDay(startOfDay(new Date()));
  }, [schedulerResetKey]);

  const showVariantUi = variantAxes.length > 0;
  const showUnitPrice = !showVariantUi ? lineUnitRentPrice > 0 : lineStock > 0 && lineUnitRentPrice > 0;

  const billUnits = rentValidity.ok ? rentValidity.billUnits : 0;
  const estimatedTotal = showUnitPrice && billUnits > 0 ? lineUnitRentPrice * billUnits * rentQty : 0;

  const unitLabelVu = rentUnitLabelVu(rentUnit);

  const scheduleLocked = lineStock <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "mx-auto flex min-h-0 min-w-0 max-h-[90vh] w-[min(calc(100vw-1.5rem),60vw)] max-w-[60vw] flex-col gap-0 overflow-hidden rounded-3xl p-5 sm:p-7",
          "border-border/80 bg-card/95 backdrop-blur-md shadow-2xl dark:border-border/50 dark:bg-card/98 dark:shadow-black/50",
          "transition-[max-width,width] duration-300 ease-out motion-reduce:transition-none",
        )}
      >
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-1 w-full rounded-t-3xl bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50 dark:from-secondary/40 dark:via-secondary/90 dark:to-secondary/40" />
        <DialogHeader className="shrink-0 pt-1">
          <DialogTitle className="text-xl font-display">Thuê ngay</DialogTitle>
          <DialogDescription className="sr-only">Chọn tùy chọn, khung giờ theo đơn vị và số lượng</DialogDescription>
        </DialogHeader>
        <div className="hide-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4 border-b border-border/60 pb-5 dark:border-border/50">
              <img
                src={heroImageUrl}
                className="aspect-square h-36 w-36 shrink-0 rounded-xl object-cover ring-1 ring-border/50 shadow-sm sm:h-44 sm:w-44 dark:ring-border/40"
                alt={cartBridge.name}
              />
              <div className="min-w-0 flex-1 space-y-3">
                <h4 className="font-bold text-foreground line-clamp-2 leading-snug">{cartBridge.name}</h4>
                {!showVariantUi && lineUnitRentPrice > 0 ? (
                  <p className="text-sm font-semibold tabular-nums text-secondary-foreground">
                    {formatCurrency(lineUnitRentPrice)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">/ {unitLabelVu}</span>
                  </p>
                ) : null}
                {showVariantUi ? (
                  <ListingVariantAttributePickers
                    axes={variantAxes}
                    selection={variantSelection}
                    onChange={onVariantSelectionChange}
                  />
                ) : null}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Kho: <span className="font-semibold tabular-nums text-foreground">{rentalsLoading ? "…" : lineStock}</span>
                  </span>
                  {showUnitPrice ? (
                    <span>
                      Giá:{" "}
                      <span className="font-semibold tabular-nums text-secondary-foreground">
                        {formatCurrency(lineUnitRentPrice)} / {unitLabelVu}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-[padding,box-shadow] duration-300 dark:border-border/45",
                rentUnit === "HOUR"
                  ? "bg-gradient-to-br from-sky-50/70 via-background to-emerald-50/30 p-4 sm:p-5 dark:from-sky-950/25 dark:via-card dark:to-emerald-950/20"
                  : "bg-gradient-to-br from-muted/25 via-background to-muted/15 p-4 sm:p-5 dark:from-muted/15 dark:via-card dark:to-muted/10",
              )}
            >
              {rentUnit === "HOUR" ? (
                <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-border/40 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 dark:border-border/35">
                  <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lịch và khung thuê
                  </p>
                  <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:max-w-[14rem]">
                    <label htmlFor="rent-hour-day" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />
                      Ngày thuê
                    </label>
                    <input
                      id="rent-hour-day"
                      type="date"
                      disabled={scheduleLocked}
                      className={cn(
                        "h-10 w-full min-w-0 rounded-xl border-2 bg-muted/30 px-3 text-sm font-medium tabular-nums outline-none sm:w-[13.5rem]",
                        "border-border/50 shadow-sm transition-colors",
                        "hover:border-border/80",
                        "focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:bg-muted/20",
                      )}
                      min={format(startOfDay(new Date()), "yyyy-MM-dd")}
                      value={format(hourRentDay, "yyyy-MM-dd")}
                      onChange={(ev) => {
                        const raw = ev.target.value;
                        if (!raw) return;
                        setHourRentDay(startOfDay(new Date(`${raw}T12:00:00`)));
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lịch và khung thuê</p>
              )}
              <div className="min-w-0 max-w-full">
                <ListingRentScheduler
                  resetKey={schedulerResetKey}
                  rentUnit={rentUnit}
                  scheduleResourceLabel={cartBridge.name}
                  hourDay={rentUnit === "HOUR" ? hourRentDay : undefined}
                  onHourDayChange={rentUnit === "HOUR" ? setHourRentDay : undefined}
                  disabled={scheduleLocked}
                  bookings={bookings}
                  concurrencyCap={lineStock}
                  rentQty={rentQty}
                  parentWindow={rentWindow}
                  onWindowChange={onRentWindowChange}
                  onValidityChange={onRentValidityChange}
                />
              </div>

              <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3.5 dark:border-border/50 dark:bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tạm tính</p>
                {rentValidity.ok && billUnits > 0 ? (
                  <>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>Số đơn vị</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {billUnits} {unitLabelVu}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Thành tiền</span>
                      {showUnitPrice ? (
                        <span className="font-bold text-primary tabular-nums">{formatCurrency(estimatedTotal)}</span>
                      ) : (
                        <span className="font-medium text-muted-foreground">—</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm tabular-nums text-muted-foreground">—</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-sm text-foreground">Số lượng</span>
                {lineStock > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tối đa {lineStock}</p>
                )}
              </div>
              <div className="flex items-center overflow-hidden rounded-2xl border-2 border-border/60 bg-muted/20 shadow-sm dark:border-border/45 dark:bg-muted/15">
                <button
                  type="button"
                  onClick={() => onRentQtyChange(Math.max(1, rentQty - 1))}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  disabled={lineStock <= 0 || rentQty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex h-10 min-w-[2.75rem] items-center justify-center border-x border-border/50 px-2 font-bold tabular-nums text-base text-foreground">
                  {rentQty}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (lineStock <= 0) return;
                    onRentQtyChange(Math.min(lineStock, rentQty + 1));
                  }}
                  disabled={lineStock <= 0 || rentQty >= lineStock}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!rentValidity.ok && "error" in rentValidity && rentValidity.error ? (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/15">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{rentValidity.error}</span>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="mt-2 shrink-0 gap-2 border-t border-border/40 pt-4 dark:border-border/35 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-border/80">
            Hủy
          </Button>
          <Button
            onClick={onCheckout}
            disabled={checkoutDisabled}
            className="rounded-full px-8 bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/90 dark:shadow-black/30"
          >
            Thuê ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
