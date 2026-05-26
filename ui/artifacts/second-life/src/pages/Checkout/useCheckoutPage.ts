import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";

import { getFacilityById } from "@/api/facility";
import { getProfileById, profileDisplayName, type ProfilePayload } from "@/api/profile";
import { fetchListingPublicDetail } from "@/api/listing";
import { fetchListingVariantAvailability, fetchListingVariantAvailabilityInRange } from "@/api/inventory";
import { buildCheckoutLineItem, type CheckoutLineItem } from "@/checkout/build-checkout-line";
import {
  clearPendingCheckoutLine,
  getPendingCheckoutLine,
  parseCheckoutSearch,
  type CheckoutLineInput,
} from "@/checkout/checkout-session";
import { resolveFacilityPlaceNames } from "@/lib/facility-display";
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

function mergeOwnerContact(
  base: CheckoutLineItem,
  owner: ProfilePayload | undefined,
): CheckoutLineItem {
  if (!owner) return base;
  const name = profileDisplayName(owner);
  const email = owner.email?.trim() || base.ownerEmail;
  const phone = owner.phoneNumber?.trim() || base.ownerPhone;
  return {
    ...base,
    ownerDisplayName: name,
    ownerEmail: email,
    ownerPhone: phone,
  };
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

  const listing = listingQuery.data;
  const facilityIdFromListing = listing?.facility?.id?.trim() ?? "";

  const facilityQuery = useQuery({
    queryKey: ["checkoutFacilityDetail", facilityIdFromListing] as const,
    queryFn: () => getFacilityById(facilityIdFromListing),
    enabled: Boolean(facilityIdFromListing),
    staleTime: 60_000,
    retry: 1,
  });

  const facilityOwnerId =
    facilityQuery.data?.ownerId?.trim() ||
    listing?.facility?.ownerId?.trim() ||
    listing?.product?.ownerId?.trim() ||
    "";

  const ownerProfileQuery = useQuery({
    queryKey: ["checkoutFacilityOwner", facilityOwnerId] as const,
    queryFn: () => getProfileById(facilityOwnerId),
    enabled: Boolean(facilityOwnerId),
    staleTime: 60_000,
    retry: 1,
  });

  const facilityProvinceCode =
    facilityQuery.data?.provinceCode?.trim() || listing?.facility?.provinceCode?.trim() || "";
  const facilityWardCode =
    facilityQuery.data?.wardCode?.trim() || listing?.facility?.wardCode?.trim() || "";

  const placeNamesQuery = useQuery({
    queryKey: ["checkoutFacilityPlace", facilityProvinceCode, facilityWardCode] as const,
    queryFn: () => resolveFacilityPlaceNames(facilityProvinceCode, facilityWardCode),
    enabled: Boolean(facilityProvinceCode),
    staleTime: 300_000,
    retry: 1,
  });

  const line: CheckoutLineItem | null = useMemo(() => {
    if (!input || !listing || !availabilityQuery.data) return null;
    const facilityData = facilityIdFromListing
      ? facilityQuery.data ?? listing.facility
      : listing.facility;
    const base = buildCheckoutLineItem(
      input,
      listing,
      availabilityQuery.data,
      facilityData ?? null,
    );
    if (!base) return null;

    let merged = mergeOwnerContact(base, ownerProfileQuery.data);
    const places = placeNamesQuery.data;
    if (places) {
      merged = {
        ...merged,
        facilityProvinceName: places.provinceName,
        facilityWardName: places.wardName,
      };
    }
    return merged;
  }, [
    input,
    listing,
    availabilityQuery.data,
    facilityIdFromListing,
    facilityQuery.data,
    ownerProfileQuery.data,
    placeNamesQuery.data,
  ]);

  const isLoading =
    Boolean(input) &&
    (listingQuery.isLoading ||
      availabilityQuery.isFetching ||
      (Boolean(facilityIdFromListing) && facilityQuery.isLoading && !facilityQuery.data) ||
      (Boolean(facilityOwnerId) && ownerProfileQuery.isLoading && !ownerProfileQuery.data) ||
      (Boolean(facilityProvinceCode) && placeNamesQuery.isLoading && !placeNamesQuery.data));

  const apiError = listingQuery.error ?? availabilityQuery.error ?? facilityQuery.error;

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

  const ownerNameLoading =
    Boolean(facilityOwnerId) &&
    ownerProfileQuery.isLoading &&
    !line?.ownerDisplayName?.trim();

  const placeNamesLoading =
    Boolean(facilityProvinceCode) &&
    placeNamesQuery.isLoading &&
    !line?.facilityWardName?.trim() &&
    !line?.facilityProvinceName?.trim();

  return {
    input,
    line,
    items: line ? [line] : [],
    isLoading,
    isError,
    errorView,
    ownerNameLoading,
    placeNamesLoading,
    clearSession,
    refetch: () => {
      void listingQuery.refetch();
      void availabilityQuery.refetch();
      if (facilityIdFromListing) void facilityQuery.refetch();
      if (facilityOwnerId) void ownerProfileQuery.refetch();
      if (facilityProvinceCode) void placeNamesQuery.refetch();
    },
  };
}
