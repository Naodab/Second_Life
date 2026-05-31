import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { buildFreshSearchPath } from "@/lib/search-url";

type Props = {
  subId: string | null;
  subName: string;
  listingTitle: string;
};

export function ListingDetailBreadcrumb({ subId, subName, listingTitle }: Props) {
  return (
    <div className="border-b border-border/80 bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 dark:border-border/60 dark:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
          <Link
            href="/"
            className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/90 hover:text-foreground dark:hover:bg-muted/50"
          >
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <Link
            href={buildFreshSearchPath(subId ? { subCategoryId: subId } : {})}
            className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/90 hover:text-foreground dark:hover:bg-muted/50"
          >
            {subName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <span className="max-w-[min(100%,220px)] truncate font-medium text-foreground sm:max-w-[min(100%,360px)]">
            {listingTitle}
          </span>
        </nav>
      </div>
    </div>
  );
}
