import { HttpErrorPageLayout, type HttpErrorPageLayoutProps } from "./HttpErrorPageLayout";
import { ErrorStateActions, type ErrorStateActionsProps } from "./ErrorStateActions";

export type BadRequestErrorViewProps = ErrorStateActionsProps &
  Pick<HttpErrorPageLayoutProps, "variant" | "className"> & {
    title?: string;
    message?: string;
    errorCode?: number;
  };

/** Trang lỗi 400 — nền ảnh full màn hình. */
export function BadRequestErrorView({
  title = "Thông tin không hợp lệ",
  message = "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại và thử lại.",
  errorCode,
  variant = "fullscreen",
  className,
  onBack,
  backLabel,
  onRetry,
  retryLabel,
  homeHref,
  homeLabel,
}: BadRequestErrorViewProps) {
  return (
    <HttpErrorPageLayout
      httpStatus={400}
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
