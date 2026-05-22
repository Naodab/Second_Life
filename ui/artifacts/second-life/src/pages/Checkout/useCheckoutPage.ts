import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";

import { fetchListingPublicDetail } from "@/api/listing";
import { fetchListingVariantAvailability, fetchListingVariantAvailabilityInRange } from "@/api/inventory";
import { buildCheckoutLineItem, type CheckoutLineItem } from "@/checkout/build-checkout-line";
import {
  clearPendingCheckoutLine,
  getPendingCheckoutLine,
  parseCheckoutSearch,
  type CheckoutLineInput,
} from "@/checkout/checkout-session";
import { mapApiError, type ApiErrorViewModel } from "@/lib/api-error";

function availabilityForInput(input: CheckoutLineInput) {
  if (input.mode === "rent" && input.rentalStart && input.rentalEnd) {
    return fetchListingVariantAvailabilityInRange(input.listingVariantId, {
      from: input.rentalStart,
      to: input.rentalEnd,
      mode: "RENT",
      quantity: input.quantity,
    });
  }
  return fetchListingVariantAvailability(input.listingVariantId, input.mode === "buy" ? "BUY" : "RENT", {
    quantity: input.quantity,
  });
}

export function useCheckoutPage() {
  const search = useSearch();

  const input: CheckoutLineInput | null = useMemo(() => {
    const fromUrl = parseCheckoutSearch(search);
    if (fromUrl) return fromUrl;
    return getPendingCheckoutLine();
  }, [search]);

  const listingQuery = useQuery({
    queryKey: ["checkoutListingDetail", input?.listingId, input?.listingVariantId] as const,
    queryFn: () =>
      fetchListingPublicDetail(input!.listingId, {
        listingVariantId: input!.listingVariantId,
      }),
    enabled: Boolean(input?.listingId && input?.listingVariantId),
    staleTime: 30_000,
    retry: false,
  });

  const availabilityQuery = useQuery({
    queryKey: [
      "checkoutVariantAvailability",
      input?.listingVariantId,
      input?.mode,
      input?.quantity,
      input?.rentalStart,
      input?.rentalEnd,
    ] as const,
    queryFn: () => availabilityForInput(input!),
    enabled: Boolean(input?.listingVariantId && input.quantity >= 1),
    staleTime: 10_000,
    retry: false,
  });

  const line: CheckoutLineItem | null = useMemo(() => {
    if (!input || !listingQuery.data || !availabilityQuery.data) return null;
    return buildCheckoutLineItem(input, listingQuery.data, availabilityQuery.data);
  }, [input, listingQuery.data, availabilityQuery.data]);

  const isLoading =
    Boolean(input) && (listingQuery.isLoading || availabilityQuery.isFetching);

  const apiError = listingQuery.error ?? availabilityQuery.error;

  const errorView: ApiErrorViewModel | null = useMemo(() => {
    if (!input) {
      return {
        kind: "bad_request",
        title: "Thông tin không hợp lệ",
        message: "Không có thông tin thanh toán. Vui lòng chọn sản phẩm từ trang chi tiết.",
      };
    }
    if (apiError) {
      return mapApiError(apiError, {
        fallbackTitle: "Không thể tải đơn hàng",
        fallbackMessage: "Đã xảy ra lỗi khi tải thông tin thanh toán. Vui lòng thử lại sau.",
      });
    }
    if (listingQuery.isSuccess && availabilityQuery.isSuccess && !line) {
      return {
        kind: "not_found",
        title: "Không tìm thấy sản phẩm",
        message: "Không tìm thấy phiên bản sản phẩm đã chọn trên listing này.",
      };
    }
    return null;
  }, [input, apiError, listingQuery.isSuccess, availabilityQuery.isSuccess, line]);

  const isError = Boolean(errorView) && !isLoading;

  const clearSession = () => {
    clearPendingCheckoutLine();
  };

  return {
    input,
    line,
    items: line ? [line] : [],
    isLoading,
    isError,
    errorView,
    clearSession,
    refetch: () => {
      void listingQuery.refetch();
      void availabilityQuery.refetch();
    },
  };
}
