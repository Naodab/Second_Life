import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useSearch } from "wouter";

import { getFacilityById, type FacilityResponse } from "@/api/facility";
import { getProfileById, profileDisplayName, type ProfilePayload } from "@/api/profile";
import { fetchListingPublicDetail } from "@/api/listing";
import { fetchListingVariantAvailability, fetchListingVariantAvailabilityInRange } from "@/api/inventory";
import { buildCheckoutLineItem, type CheckoutLineItem } from "@/checkout/build-checkout-line";
import {
  clearPendingCheckoutLine,
  resolveCheckoutInputs,
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

  const inputs: CheckoutLineInput[] = useMemo(() => resolveCheckoutInputs(search), [search]);

  const listingQueries = useQueries({
    queries: inputs.map((input) => ({
      queryKey: ["checkoutListingDetail", input.listingId, input.listingVariantId] as const,
      queryFn: () =>
        fetchListingPublicDetail(input.listingId, {
          listingVariantId: input.listingVariantId,
        }),
      enabled: Boolean(input.listingId && input.listingVariantId),
      staleTime: 30_000,
      retry: false,
    })),
  });

  const availabilityQueries = useQueries({
    queries: inputs.map((input) => ({
      queryKey: [
        "checkoutVariantAvailability",
        input.listingVariantId,
        input.mode,
        input.quantity,
        input.rentalStart,
        input.rentalEnd,
      ] as const,
      queryFn: () => availabilityForInput(input),
      enabled: Boolean(input.listingVariantId && input.quantity >= 1),
      staleTime: 10_000,
      retry: false,
    })),
  });

  const facilityIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < inputs.length; i++) {
      const listing = listingQueries[i]?.data;
      const fromFacility = listing?.facility?.id?.trim();
      if (fromFacility) ids.add(fromFacility);
    }
    return [...ids];
  }, [inputs.length, listingQueries]);

  const facilityQueries = useQueries({
    queries: facilityIds.map((facilityId) => ({
      queryKey: ["checkoutFacilityDetail", facilityId] as const,
      queryFn: () => getFacilityById(facilityId),
      enabled: Boolean(facilityId),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const facilityById = useMemo(() => {
    const map = new Map<string, NonNullable<(typeof facilityQueries)[number]["data"]>>();
    facilityIds.forEach((id, idx) => {
      const data = facilityQueries[idx]?.data;
      if (data) map.set(id, data);
    });
    return map;
  }, [facilityIds, facilityQueries]);

  const ownerIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < inputs.length; i++) {
      const listing = listingQueries[i]?.data;
      const facilityId = listing?.facility?.id?.trim() ?? "";
      const facility =
        (facilityId ? facilityById.get(facilityId) : null) ?? listing?.facility ?? null;
      const ownerId =
        facility?.ownerId?.trim() ||
        listing?.facility?.ownerId?.trim() ||
        listing?.product?.ownerId?.trim() ||
        "";
      if (ownerId) ids.add(ownerId);
    }
    return [...ids];
  }, [inputs.length, listingQueries, facilityById]);

  const ownerQueries = useQueries({
    queries: ownerIds.map((ownerId) => ({
      queryKey: ["checkoutFacilityOwner", ownerId] as const,
      queryFn: () => getProfileById(ownerId),
      enabled: Boolean(ownerId),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const ownerById = useMemo(() => {
    const map = new Map<string, ProfilePayload>();
    ownerIds.forEach((id, idx) => {
      const data = ownerQueries[idx]?.data;
      if (data) map.set(id, data);
    });
    return map;
  }, [ownerIds, ownerQueries]);

  const placeKeys = useMemo(() => {
    const keys = new Map<string, { provinceCode: string; wardCode: string }>();
    for (let i = 0; i < inputs.length; i++) {
      const listing = listingQueries[i]?.data;
      const facilityId = listing?.facility?.id?.trim() ?? "";
      const facility =
        (facilityId ? facilityById.get(facilityId) : null) ?? listing?.facility ?? null;
      const provinceCode = facility?.provinceCode?.trim() ?? "";
      const wardCode = facility?.wardCode?.trim() ?? "";
      if (!provinceCode) continue;
      const key = `${provinceCode}:${wardCode}`;
      if (!keys.has(key)) keys.set(key, { provinceCode, wardCode });
    }
    return [...keys.values()];
  }, [inputs.length, listingQueries, facilityById]);

  const placeQueries = useQueries({
    queries: placeKeys.map(({ provinceCode, wardCode }) => ({
      queryKey: ["checkoutFacilityPlace", provinceCode, wardCode] as const,
      queryFn: () => resolveFacilityPlaceNames(provinceCode, wardCode),
      enabled: Boolean(provinceCode),
      staleTime: 300_000,
      retry: 1,
    })),
  });

  const placesByKey = useMemo(() => {
    const map = new Map<string, { provinceName: string; wardName: string }>();
    placeKeys.forEach((key, idx) => {
      const data = placeQueries[idx]?.data;
      if (data) map.set(`${key.provinceCode}:${key.wardCode}`, data);
    });
    return map;
  }, [placeKeys, placeQueries]);

  const items: CheckoutLineItem[] = useMemo(() => {
    const built: CheckoutLineItem[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const listing = listingQueries[i]?.data;
      const availability = availabilityQueries[i]?.data;
      if (!listing || !availability) continue;

      const facilityId = listing.facility?.id?.trim() ?? "";
      const facilityData: FacilityResponse | null =
        (facilityId ? facilityById.get(facilityId) : null) ??
        (listing.facility as FacilityResponse | null) ??
        null;
      const ownerId =
        facilityData?.ownerId?.trim() ||
        listing.facility?.ownerId?.trim() ||
        listing.product?.ownerId?.trim() ||
        "";
      const owner = ownerId ? ownerById.get(ownerId) : undefined;

      const provinceCode = facilityData?.provinceCode?.trim() ?? "";
      const wardCode = facilityData?.wardCode?.trim() ?? "";
      const places = provinceCode ? placesByKey.get(`${provinceCode}:${wardCode}`) : undefined;

      const base = buildCheckoutLineItem(input, listing, availability, facilityData ?? null);
      if (!base) continue;

      let merged = mergeOwnerContact(base, owner);
      if (places) {
        merged = {
          ...merged,
          facilityProvinceName: places.provinceName,
          facilityWardName: places.wardName,
        };
      }
      built.push(merged);
    }
    return built;
  }, [
    inputs,
    listingQueries,
    availabilityQueries,
    facilityById,
    ownerById,
    placesByKey,
  ]);

  const line = items.length === 1 ? items[0] : null;

  const listingsLoading = inputs.length > 0 && listingQueries.some((q) => q.isLoading);
  const availabilityLoading =
    inputs.length > 0 && availabilityQueries.some((q) => q.isFetching);
  const facilitiesLoading =
    facilityIds.length > 0 && facilityQueries.some((q) => q.isLoading && !q.data);
  const ownersLoading = ownerIds.length > 0 && ownerQueries.some((q) => q.isLoading && !q.data);
  const placesLoading =
    placeKeys.length > 0 && placeQueries.some((q) => q.isLoading && !q.data);

  const isLoading =
    inputs.length > 0 &&
    (listingsLoading ||
      availabilityLoading ||
      facilitiesLoading ||
      ownersLoading ||
      placesLoading);

  const apiError =
    listingQueries.find((q) => q.error)?.error ??
    availabilityQueries.find((q) => q.error)?.error ??
    facilityQueries.find((q) => q.error)?.error;

  const allListingsReady = inputs.length > 0 && listingQueries.every((q) => q.isSuccess);
  const allAvailabilityReady =
    inputs.length > 0 && availabilityQueries.every((q) => q.isSuccess);

  const errorView: ApiErrorViewModel | null = useMemo(() => {
    if (inputs.length === 0) {
      return {
        kind: "bad_request",
        title: "Thông tin không hợp lệ",
        message: "Không có thông tin thanh toán. Vui lòng chọn sản phẩm từ giỏ hàng hoặc trang chi tiết.",
      };
    }
    if (apiError) {
      return mapApiError(apiError, {
        fallbackTitle: "Không thể tải đơn hàng",
        fallbackMessage: "Đã xảy ra lỗi khi tải thông tin thanh toán. Vui lòng thử lại sau.",
      });
    }
    if (allListingsReady && allAvailabilityReady && items.length !== inputs.length) {
      return {
        kind: "not_found",
        title: "Không tìm thấy sản phẩm",
        message: "Một hoặc nhiều sản phẩm đã chọn không còn khả dụng.",
      };
    }
    return null;
  }, [inputs.length, apiError, allListingsReady, allAvailabilityReady, items.length]);

  const isError = Boolean(errorView) && !isLoading;

  const clearSession = () => {
    clearPendingCheckoutLine();
  };

  const ownerNameLoading =
    ownerIds.length > 0 &&
    ownerQueries.some((q) => q.isLoading) &&
    items.some((item) => !item.ownerDisplayName?.trim());

  const placeNamesLoading =
    placeKeys.length > 0 &&
    placeQueries.some((q) => q.isLoading) &&
    items.some((item) => !item.facilityWardName?.trim() && !item.facilityProvinceName?.trim());

  const refetch = () => {
    listingQueries.forEach((q) => void q.refetch());
    availabilityQueries.forEach((q) => void q.refetch());
    facilityQueries.forEach((q) => void q.refetch());
    ownerQueries.forEach((q) => void q.refetch());
    placeQueries.forEach((q) => void q.refetch());
  };

  return {
    inputs,
    line,
    items,
    isLoading,
    isError,
    errorView,
    ownerNameLoading,
    placeNamesLoading,
    clearSession,
    refetch,
  };
}
