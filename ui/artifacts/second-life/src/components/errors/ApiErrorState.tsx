import type { ReactNode } from "react";
import { mapApiError, type ApiErrorViewModel, type MapApiErrorOptions } from "@/lib/api-error";
import { BadRequestErrorView, type BadRequestErrorViewProps } from "./BadRequestErrorView";
import { InsufficientStockErrorView, type InsufficientStockErrorViewProps } from "./InsufficientStockErrorView";
import { NotFoundErrorView, type NotFoundErrorViewProps } from "./NotFoundErrorView";
import { ServerErrorView, type ServerErrorViewProps } from "./ServerErrorView";

type ActionProps = Pick<
  NotFoundErrorViewProps,
  | "onBack"
  | "backLabel"
  | "onRetry"
  | "retryLabel"
  | "homeHref"
  | "homeLabel"
  | "variant"
  | "className"
>;

export type ApiErrorStateProps = ActionProps & {
  error?: unknown;
  model?: ApiErrorViewModel;
  mapOptions?: MapApiErrorOptions;
  title?: string;
  message?: string;
  kind?: ApiErrorViewModel["kind"];
};

function resolveModel(props: ApiErrorStateProps): ApiErrorViewModel {
  if (props.model) {
    return {
      ...props.model,
      title: props.title ?? props.model.title,
      message: props.message ?? props.model.message,
    };
  }
  if (props.error != null) {
    const mapped = mapApiError(props.error, props.mapOptions);
    return {
      ...mapped,
      title: props.title ?? mapped.title,
      message: props.message ?? mapped.message,
    };
  }
  if (props.kind) {
    const defaults = mapApiError(null, props.mapOptions);
    return {
      kind: props.kind,
      title: props.title ?? defaults.title,
      message: props.message ?? defaults.message,
    };
  }
  return {
    kind: "bad_request",
    title: props.title ?? "Thông tin không hợp lệ",
    message: props.message ?? "Yêu cầu không hợp lệ.",
  };
}

export function ApiErrorState(props: ApiErrorStateProps): ReactNode {
  const model = resolveModel(props);
  const common: ActionProps = {
    onBack: props.onBack,
    backLabel: props.backLabel,
    onRetry: props.onRetry,
    retryLabel: props.retryLabel,
    homeHref: props.homeHref,
    homeLabel: props.homeLabel,
    variant: props.variant ?? "embedded",
    className: props.className,
  };

  if (model.kind === "not_found") {
    return (
      <NotFoundErrorView
        {...common}
        title={model.title}
        message={model.message}
        errorCode={model.code}
      />
    );
  }

  if (model.kind === "insufficient_stock") {
    return (
      <InsufficientStockErrorView
        {...common}
        title={model.title}
        message={model.message}
        errorCode={model.code}
      />
    );
  }

  if (model.kind === "server_error") {
    return (
      <ServerErrorView
        {...common}
        title={model.title}
        message={model.message}
        errorCode={model.code}
      />
    );
  }

  if (model.kind === "bad_request") {
    return (
      <BadRequestErrorView
        {...common}
        title={model.title}
        message={model.message}
        errorCode={model.code}
      />
    );
  }

  return (
    <ServerErrorView
      {...common}
      title={model.title}
      message={model.message}
      errorCode={model.code}
    />
  );
}
