import { FileQuestion } from "lucide-react";

export function ListingDetailNotFound() {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-background to-muted/30 dark:to-muted/15">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-border/40 dark:bg-card/90 dark:shadow-xl dark:shadow-black/20 dark:ring-border/30">
        <FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-6 max-w-md text-center text-base font-semibold text-foreground">Không tìm thấy tin đăng</p>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground leading-relaxed">
        Tin có thể đã ngừng hiển thị hoặc đường dẫn không đúng. Thử quay lại trang chủ hoặc tìm kiếm.
      </p>
    </div>
  );
}
