import { ApiError } from "@workspace/api-client-react";

export const ApiErrorCodes = {
  INVALID_INPUT: 1000,
  PROFILE_NOT_FOUND: 1002,
  USER_NOT_FOUND: 1009,
  EMAIL_ALREADY_EXISTS: 1011,
  EMAIL_REGISTERED_WITH_GOOGLE: 1026,
  SIGN_IN_WITH_GOOGLE: 1027,
  CATEGORY_NOT_FOUND: 1040,
  FACILITY_NOT_FOUND: 1044,
  INVENTORY_ITEM_NOT_FOUND: 1054,
  INSUFFICIENT_INVENTORY: 1061,
  LISTING_VARIANT_NOT_FOUND: 1065,
  QUANTITY_MIN: 1063,
  ORDER_NOT_FOUND: 1067,
  ORDER_CANCEL_NOT_ALLOWED: 1068,
  ORDER_STATUS_TRANSITION_NOT_ALLOWED: 1069,
  CANNOT_MESSAGE_OWN_FACILITY: 1075,
} as const;

export type ApiErrorKind = "not_found" | "bad_request" | "insufficient_stock" | "server_error" | "generic";

export type ApiErrorViewModel = {
  kind: ApiErrorKind;
  title: string;
  message: string;
  status?: number;
  code?: number;
};

export type MapApiErrorOptions = {
  fallbackTitle?: string;
  fallbackMessage?: string;
};

export type AuthErrorToast = {
  title: string;
  description: string;
};

const LOGIN_INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không đúng.";

/** User-facing copy for login failures — never expose raw HTTP / English API messages. */
export function mapLoginError(err: unknown): AuthErrorToast {
  const code = readApiErrorCode(err);

  if (code === ApiErrorCodes.SIGN_IN_WITH_GOOGLE) {
    return {
      title: "Hãy đăng nhập bằng Google",
      description:
        "Tài khoản này được tạo với Google. Dùng nút “Đăng nhập bằng Gmail” bên trên.",
    };
  }

  if (code === ApiErrorCodes.USER_NOT_FOUND || (err instanceof ApiError && err.status === 404)) {
    return {
      title: "Đăng nhập thất bại",
      description: LOGIN_INVALID_CREDENTIALS_MESSAGE,
    };
  }

  if (err instanceof ApiError) {
    return {
      title: "Đăng nhập thất bại",
      description: LOGIN_INVALID_CREDENTIALS_MESSAGE,
    };
  }

  return {
    title: "Đăng nhập thất bại",
    description: LOGIN_INVALID_CREDENTIALS_MESSAGE,
  };
}

/** User-facing copy for register failures — avoid raw HTTP messages in toasts. */
export function mapRegisterError(err: unknown): AuthErrorToast {
  const code = readApiErrorCode(err);

  if (code === ApiErrorCodes.EMAIL_REGISTERED_WITH_GOOGLE) {
    return {
      title: "Email đã dùng với Google",
      description:
        "Địa chỉ này đã đăng ký bằng Google. Hãy đăng nhập bằng Google ở trang đăng nhập.",
    };
  }

  if (code === ApiErrorCodes.EMAIL_ALREADY_EXISTS) {
    return {
      title: "Email đã được dùng",
      description: "Tài khoản với email này đã tồn tại. Bạn có thể đăng nhập hoặc dùng Quên mật khẩu.",
    };
  }

  const apiMessage = readApiErrorMessage(err);
  if (apiMessage) {
    return {
      title: "Đăng ký không thành công",
      description: apiMessage,
    };
  }

  return {
    title: "Đăng ký không thành công",
    description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
  };
}

export function readApiErrorCode(err: unknown): number | undefined {
  if (!(err instanceof ApiError) || err.data == null || typeof err.data !== "object") {
    return undefined;
  }
  const code = (err.data as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

export function readApiErrorMessage(err: unknown): string | undefined {
  if (!(err instanceof ApiError) || err.data == null || typeof err.data !== "object") {
    return undefined;
  }
  const message = (err.data as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : undefined;
}

export function isNotFoundError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 404) return true;
  const code = readApiErrorCode(err);
  if (code == null) return false;
  return (
    code === ApiErrorCodes.PROFILE_NOT_FOUND ||
    code === ApiErrorCodes.USER_NOT_FOUND ||
    code === ApiErrorCodes.CATEGORY_NOT_FOUND ||
    code === ApiErrorCodes.FACILITY_NOT_FOUND ||
    code === ApiErrorCodes.INVENTORY_ITEM_NOT_FOUND ||
    code === ApiErrorCodes.LISTING_VARIANT_NOT_FOUND ||
    code === ApiErrorCodes.ORDER_NOT_FOUND
  );
}

export function isBadRequestError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 400) return true;
  const code = readApiErrorCode(err);
  return code === ApiErrorCodes.INVALID_INPUT || code === ApiErrorCodes.QUANTITY_MIN;
}

export function isInsufficientStockError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 409) return true;
  return readApiErrorCode(err) === ApiErrorCodes.INSUFFICIENT_INVENTORY;
}

export function mapApiError(err: unknown, options: MapApiErrorOptions = {}): ApiErrorViewModel {
  const status = err instanceof ApiError ? err.status : undefined;
  const code = readApiErrorCode(err);
  const apiMessage = readApiErrorMessage(err);

  if (code === ApiErrorCodes.ORDER_CANCEL_NOT_ALLOWED) {
    return {
      kind: "bad_request",
      title: "Không thể hủy đơn",
      message: "Chỉ có thể hủy đơn khi đang ở trạng thái chờ xác nhận.",
      status,
      code,
    };
  }

  if (isInsufficientStockError(err)) {
    return {
      kind: "insufficient_stock",
      title: "Không đủ hàng",
      message:
        apiMessage ??
        "Số lượng bạn chọn vượt quá tồn kho hiện có. Vui lòng giảm số lượng hoặc chọn phiên bản khác.",
      status,
      code,
    };
  }

  if (isNotFoundError(err) || status === 404) {
    return {
      kind: "not_found",
      title: "Không tìm thấy",
      message: apiMessage ?? "Nội dung bạn tìm không tồn tại hoặc đã bị gỡ.",
      status,
      code,
    };
  }

  if (isBadRequestError(err) || status === 400) {
    return {
      kind: "bad_request",
      title: "Thông tin không hợp lệ",
      message: apiMessage ?? "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại và thử lại.",
      status,
      code,
    };
  }

  if (status != null && status >= 500) {
    return {
      kind: "server_error",
      title: options.fallbackTitle ?? "Lỗi máy chủ",
      message: apiMessage ?? options.fallbackMessage ?? "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      status,
      code,
    };
  }

  return {
    kind: "server_error",
    title: options.fallbackTitle ?? "Đã xảy ra lỗi",
    message: apiMessage ?? options.fallbackMessage ?? "Vui lòng thử lại sau.",
    status,
    code,
  };
}
