import { HttpErrorPageLayout, type HttpErrorPageLayoutProps } from "./HttpErrorPageLayout";
import { ErrorStateActions, type ErrorStateActionsProps } from "./ErrorStateActions";

export type ServerErrorViewProps = ErrorStateActionsProps &
  Pick<HttpErrorPageLayoutProps, "variant" | "className"> & {
    title?: string;
    message?: string;
    errorCode?: number;
  };

/** Trang lỗi 500 — nền ảnh full màn hình. */
export function ServerErrorView({
  title = "Lỗi máy chủ",
  message = "Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.",
  errorCode,
  variant = "fullscreen",
  className,
  onBack,
  backLabel,
  onRetry,
  retryLabel,
  homeHref = "/",
  homeLabel,
}: ServerErrorViewProps) {
  return (
    <HttpErrorPageLayout
      httpStatus={500}
      title={title}
      message={message}
      variant={variant}
      className={className}
      businessErrorCode={errorCode}
    >
      <ErrorStateActions
        onBack={onBack}
        backLabel={backLabel}
        onRetry={onRetry}
        retryLabel={retryLabel}
        homeHref={homeHref}
        homeLabel={homeLabel}
      />
    </HttpErrorPageLayout>
  );
}
