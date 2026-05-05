import type { AttributeDto } from "@/api/listing";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { attributeAxisKey } from "./listing-variant-selection";

type Props = {
  axes: AttributeDto[];
  selection: Record<string, string>;
  onChange: (axisKey: string, valueId: string) => void;
};

export function ListingVariantAttributePickers({ axes, selection, onChange }: Props) {
  if (axes.length === 0) return null;

  return (
    <div className="space-y-5">
      {axes.map((attr) => {
        const key = attributeAxisKey(attr);
        const value = selection[key] ?? "";
        const name = attr.name?.trim() || "Tùy chọn";
        return (
          <div key={key} className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{name}</Label>
            <RadioGroup
              value={value || undefined}
              onValueChange={(v) => onChange(key, v)}
              className="flex flex-wrap gap-2"
            >
              {(attr.attributeValues ?? []).map((v) => {
                const id = v.id?.trim();
                const display = (v.value ?? "").trim() || id || "?";
                if (!id) return null;
                const inputId = `variant-${key}-${id}`;
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all",
                      "border-border/80 bg-muted/25 shadow-sm",
                      "hover:border-border hover:bg-muted/40",
                      "has-[[data-state=checked]]:border-primary/60 has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:shadow-[inset_0_0_0_1px] has-[[data-state=checked]]:shadow-primary/20",
                      "dark:border-border/50 dark:bg-muted/20 dark:hover:bg-muted/30",
                      "dark:has-[[data-state=checked]]:border-primary/50 dark:has-[[data-state=checked]]:bg-primary/15 dark:has-[[data-state=checked]]:shadow-primary/15",
                    )}
                  >
                    <RadioGroupItem value={id} id={inputId} className="border-muted-foreground/40" />
                    <Label htmlFor={inputId} className="cursor-pointer font-normal leading-snug text-foreground">
                      {display}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}
