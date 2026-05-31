import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ERROR_BG_DARK, ERROR_BG_LIGHT } from "./error-background";

export type HttpErrorPageVariant = "fullscreen" | "embedded";

export type HttpErrorPageLayoutProps = {
  httpStatus: number | string;
  title: string;
  message: string;
  children?: ReactNode;
  className?: string;
  variant?: HttpErrorPageVariant;
  businessErrorCode?: number;
};

export function HttpErrorPageLayout({
  httpStatus,
  title,
  message,
  children,
  className,
  variant = "fullscreen",
  businessErrorCode,
}: HttpErrorPageLayoutProps) {
  const statusLabel = String(httpStatus);

  return (
    <div
      className={cn(
        "relative w-full flex-1 overflow-hidden",
        variant === "fullscreen"
          ? "min-h-[calc(100dvh-11rem)] sm:min-h-[calc(100dvh-10rem)]"
          : "min-h-[min(72vh,720px)]",
        className,
      )}
      role="alert"
      data-http-error={statusLabel}
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center dark:hidden"
        style={{ backgroundImage: `url(${ERROR_BG_LIGHT})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden bg-cover bg-no-repeat bg-center dark:block"
        style={{ backgroundImage: `url(${ERROR_BG_DARK})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-white/25 dark:bg-black/50"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-16",
          variant === "fullscreen" ? "min-h-[inherit] py-12 sm:py-16 lg:py-20" : "min-h-[inherit] py-10 sm:py-14",
        )}
      >
        <div className="max-w-2xl">
          <p
            className={cn(
              "font-display font-bold leading-[0.85] tracking-tight",
              "text-[clamp(4.5rem,22vw,10.5rem)]",
              "text-emerald-950/85 [text-shadow:0_2px_24px_rgba(255,255,255,0.75),0_1px_3px_rgba(15,23,42,0.12)]",
              "dark:text-emerald-50/90 dark:[text-shadow:0_4px_32px_rgba(0,0,0,0.65),0_2px_4px_rgba(0,0,0,0.85)]",
            )}
            aria-hidden
          >
            {statusLabel}
          </p>

          <div
            className={cn(
              "mt-6 sm:mt-8 max-w-lg rounded-3xl border border-white/50 bg-white/75 px-6 py-5 shadow-lg shadow-emerald-950/5 backdrop-blur-md",
              "dark:border-emerald-900/40 dark:bg-emerald-950/55 dark:shadow-black/30",
            )}
          >
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{title}</h1>
            {children ? <div className="mt-6">{children}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
