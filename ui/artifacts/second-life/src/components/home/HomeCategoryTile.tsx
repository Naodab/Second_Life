import { Link } from "wouter";
import { ArrowRight, Layers } from "lucide-react";
import type { CategoryResponse } from "@/api/categories";
import { buildFreshSearchPath } from "@/lib/search-url";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function HomeCategoryTile({ category }: { category: CategoryResponse }) {
  const subs = category.items ?? [];
  const hasSubs = subs.length > 0;
  const count = subs.length;

  return (
    <div
      className={cn(
        "flex-none flex items-center gap-2 rounded-2xl border border-primary/15 bg-card/90 backdrop-blur-sm shadow-sm",
        "w-[220px] shrink-0 px-3 py-3 transition-all",
        "hover:border-primary/35 hover:shadow-md hover:bg-card",
      )}
    >
      <Link
        href={buildFreshSearchPath({ categoryIds: [category.id] })}
        className="min-w-0 flex-1 group flex min-h-[52px] items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex w-full items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/20">
            <span className="text-lg font-bold leading-none text-primary">{category.name.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{category.name}</span>
            {count > 0 ? (
              <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{count} danh mục con</span>
            ) : null}
          </div>
        </div>
      </Link>

      {hasSubs ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-xl border border-primary/20 bg-primary/5 text-primary shadow-sm",
                "transition-colors hover:bg-primary/12 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "data-[state=open]:bg-primary/15",
              )}
              aria-label={`Xem danh mục con trong ${category.name}`}
            >
              <Layers className="h-4 w-4" aria-hidden />
              <span className="sr-only">Danh mục con ({count})</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" side="bottom" sideOffset={8} className="w-[min(100vw-2rem,17rem)] p-0 overflow-hidden">
            <div className="border-b bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground truncate">{category.name}</div>
            <ScrollArea className="max-h-56">
              <div role="listbox" aria-label={`Danh mục con của ${category.name}`} className="py-1">
                {subs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={buildFreshSearchPath({ subCategoryId: sub.id })}
                    role="option"
                    className="block w-full truncate px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-1.5">
              <Link
                href={buildFreshSearchPath({ categoryIds: [category.id] })}
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent"
              >
                Xem tất cả trong nhóm
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
