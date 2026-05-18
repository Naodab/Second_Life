import { useMemo } from "react";

import type { AttributeDto } from "@/api/listing";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { attributeAxisKey } from "./listing-variant-selection";

type Props = {
  axes: AttributeDto[];
  selection: Record<string, string>;
  onChange: (axisKey: string, valueId: string) => void;
};

type AxisRow = {
  key: string;
  name: string;
  /** Cố định độ dài = maxCols; ô thừa là null */
  slots: ({ id: string; display: string } | null)[];
};

export function ListingVariantAttributePickers({ axes, selection, onChange }: Props) {
  const { maxCols, rows } = useMemo(() => {
    const rowData: AxisRow[] = axes.map((attr) => {
      const key = attributeAxisKey(attr);
      const name = attr.name?.trim() || "Tùy chọn";
      const slots = (attr.attributeValues ?? [])
        .map((v) => {
          const id = v.id?.trim();
          if (!id) return null;
          const display = (v.value ?? "").trim() || id || "?";
          return { id, display };
        })
        .filter((s): s is { id: string; display: string } => s !== null);
      return { key, name, slots };
    });
    const maxCols = Math.max(1, ...rowData.map((r) => r.slots.length));
    const rows: AxisRow[] = rowData.map((r) => ({
      ...r,
      slots: [...r.slots, ...Array(Math.max(0, maxCols - r.slots.length)).fill(null)] as (
        | { id: string; display: string }
        | null
      )[],
    }));
    return { maxCols, rows };
  }, [axes]);

  if (axes.length === 0) return null;

  const gridTemplateColumns = `minmax(5.75rem, 8.5rem) repeat(${maxCols}, minmax(0, max-content))`;

  return (
    <div className="grid gap-x-1 gap-y-2" style={{ gridTemplateColumns }}>
      {rows.map((row) => (
        <div key={row.key} className="contents">
          <span className="self-center text-xs font-medium leading-tight text-muted-foreground">{row.name}</span>
          {row.slots.map((slot, colIdx) => {
            if (!slot) {
              return <div key={`${row.key}-empty-${colIdx}`} className="min-h-[1.35rem]" aria-hidden />;
            }
            const inputId = `variant-${row.key}-${slot.id}`;
            const checked = selection[row.key] === slot.id;
            return (
              <label
                key={slot.id}
                htmlFor={inputId}
                className={cn(
                  "flex min-h-[1.35rem] cursor-pointer items-center gap-1.5 text-sm leading-tight text-foreground",
                )}
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c === true) onChange(row.key, slot.id);
                  }}
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/45 shadow-none",
                    "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
                    "[&_svg]:h-2 [&_svg]:w-2 [&_svg]:stroke-[3]",
                  )}
                />
                <span className="min-w-0 select-none">{slot.display}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
