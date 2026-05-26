import { HttpErrorPageLayout, type HttpErrorPageLayoutProps } from "./HttpErrorPageLayout";
import { ErrorStateActions, type ErrorStateActionsProps } from "./ErrorStateActions";

export type NotFoundErrorViewProps = ErrorStateActionsProps &
  Pick<HttpErrorPageLayoutProps, "variant" | "className"> & {
    title?: string;
    message?: string;
    errorCode?: number;
  };

export function NotFoundErrorView({
  title = "Không tìm thấy",
  message = "Nội dung bạn tìm không tồn tại hoặc đã bị gỡ.",
  errorCode,
  variant = "fullscreen",
  className,
  onBack,
  backLabel,
  onRetry,
  retryLabel,
  homeHref = "/",
  homeLabel,
}: NotFoundErrorViewProps) {
  return (
    <HttpErrorPageLayout
      httpStatus={404}
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
