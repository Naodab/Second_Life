import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { buildPaginationPageSlots } from "@/lib/listing-pagination";

/** Bar phân trang kiểu tab «Bài đăng» trong hub cơ sở + trang khám phá Search. */
export function ListingPaginationBar({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (zeroBasedPage: number) => void;
}) {
  const slots = useMemo(
    () => buildPaginationPageSlots(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex flex-col gap-4 pt-6 mt-6 border-t items-end">
      <p className="text-xs text-muted-foreground tabular-nums text-right w-full">
        Trang {currentPage + 1}/{Math.max(1, totalPages)} · Tối đa {pageSize} {itemLabel} / trang · {totalItems} mục
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 w-full">
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="tabular-nums"
            disabled={currentPage <= 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          >
            Trước
          </Button>
          {slots.map((slot) =>
            slot.type === "ellipsis" ? (
              <span
                key={slot.key}
                className="px-1 text-muted-foreground text-sm select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={slot.index}
                type="button"
                variant={currentPage === slot.index ? "default" : "outline"}
                size="sm"
                className="min-w-9 px-2.5 tabular-nums"
                onClick={() => onPageChange(slot.index)}
              >
                {slot.index + 1}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="tabular-nums"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Alias: tab «Sản phẩm» — cùng giao diện quản trị cũ, tách tên để khỏi lẫn với luồng listing/search. */
export const ManageProductPaginationBar = ListingPaginationBar;
