import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorStateActionsProps = {
  onBack?: () => void;
  backLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
};

export function ErrorStateActions({
  onBack,
  backLabel = "Trở lại",
  onRetry,
  retryLabel = "Thử lại",
  homeHref,
  homeLabel = "Về trang chủ",
  className,
}: ErrorStateActionsProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-emerald-900/15 bg-white/80 shadow-sm hover:bg-white dark:border-emerald-700/40 dark:bg-emerald-950/40"
          onClick={onBack}
        >
          {backLabel}
        </Button>
      ) : null}
      {onRetry ? (
        <Button type="button" className="rounded-full shadow-md shadow-primary/20" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      {homeHref ? (
        <Link href={homeHref}>
          <Button
            type="button"
            variant={onBack || onRetry ? "secondary" : "default"}
            className="rounded-full w-full sm:w-auto shadow-md shadow-primary/15"
          >
            {homeLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
