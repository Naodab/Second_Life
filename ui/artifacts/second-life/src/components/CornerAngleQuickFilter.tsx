import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategories } from "@/hooks/use-categories";
import { buildFreshSearchPath, buildSearchPath } from "@/lib/search-url";

type Props = {
  variant: "home" | "search";
};

function readCategoryIdFromUrl(location: string): string | undefined {
  const q = location.includes("?") ? (location.split("?")[1] ?? "") : "";
  const sp = new URLSearchParams(q);
  const fromSingular = sp.get("categoryId")?.trim();
  if (fromSingular) return fromSingular;
  const fromPlural = [...sp.getAll("categoryIds[]"), ...sp.getAll("categoryIds")].find((v) => v?.trim());
  return fromPlural?.trim() || undefined;
}

export function CornerAngleQuickFilter({ variant }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 240);
  };

  const cancelClose = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const categoryIdFromUrl = useMemo(() => readCategoryIdFromUrl(location), [location]);

  const { data: categories, isLoading } = useCategories();
  const [draftCategoryId, setDraftCategoryId] = useState<string | undefined>();

  useEffect(() => {
    if (open) setDraftCategoryId(categoryIdFromUrl);
  }, [open, categoryIdFromUrl]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selectCategory = (id: string, checked: boolean) => {
    const sid = String(id);
    setDraftCategoryId(checked ? sid : draftCategoryId === sid ? undefined : draftCategoryId);
  };

  const apply = () => {
    if (variant === "search") {
      setLocation(
        buildSearchPath({
          categoryId: draftCategoryId ?? null,
          subCategoryId: null,
        }),
      );
    } else {
      setLocation(buildFreshSearchPath({ categoryId: draftCategoryId ?? null, subCategoryId: null }));
    }
    setOpen(false);
  };

  const shell = (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse items-end gap-1 pointer-events-auto"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Lọc nhanh theo danh mục"
          className="mb-1 w-[min(100vw-2rem,22rem)] rounded-2xl border bg-card p-4 shadow-xl"
        >
          <h3 className="font-semibold text-sm mb-1">Chọn danh mục</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {variant === "search"
              ? "Chọn một danh mục tại một thời điểm."
              : "Chọn danh mục rồi mở trang tìm kiếm với bộ lọc đó."}
          </p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground mb-4">Đang tải…</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1 custom-scrollbar mb-4">
              {categories.map((cat) => {
                const cid = String(cat.id);
                return (
                  <div key={cid} className="flex items-center gap-2">
                    <Checkbox
                      id={`corner-cat-${variant}-${cid}`}
                      checked={draftCategoryId === cid}
                      onCheckedChange={(v) => selectCategory(cid, v === true)}
                    />
                    <label htmlFor={`corner-cat-${variant}-${cid}`} className="text-sm cursor-pointer leading-snug">
                      {cat.name}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          <Button type="button" size="sm" className="w-full" onClick={apply}>
            {variant === "search" ? "Áp dụng" : "Xem kết quả"}
          </Button>
        </div>
      )}
      <button
        type="button"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
        style={{ clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 18%)" }}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          clearCloseTimer();
          setOpen((v) => !v);
        }}
      >
        <SlidersHorizontal className="h-6 w-6 drop-shadow-sm" />
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(shell, document.body);
}
