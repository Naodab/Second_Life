import { HttpErrorPageLayout, type HttpErrorPageLayoutProps } from "./HttpErrorPageLayout";
import { ErrorStateActions, type ErrorStateActionsProps } from "./ErrorStateActions";

export type InsufficientStockErrorViewProps = ErrorStateActionsProps &
  Pick<HttpErrorPageLayoutProps, "variant" | "className"> & {
    title?: string;
    message?: string;
    errorCode?: number;
  };

/** Hết hàng (409) — cùng layout trang lỗi, hiển thị mã 409. */
export function InsufficientStockErrorView({
  title = "Không đủ hàng",
  message = "Số lượng vượt quá tồn kho hiện có. Vui lòng giảm số lượng hoặc chọn lại.",
  errorCode,
  variant = "embedded",
  className,
  onBack,
  backLabel,
  onRetry,
  retryLabel,
  homeHref,
  homeLabel,
}: InsufficientStockErrorViewProps) {
  return (
    <HttpErrorPageLayout
      httpStatus={409}
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
