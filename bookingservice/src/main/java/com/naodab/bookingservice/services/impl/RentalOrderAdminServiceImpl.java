package com.naodab.bookingservice.services.impl;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.mappers.RentalOrderMapper;
import com.naodab.bookingservice.models.RentalOrder;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.bookingservice.services.RentalOrderAdminService;
import com.naodab.commonservice.response.PagedItemsResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RentalOrderAdminServiceImpl implements RentalOrderAdminService {

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  RentalOrderRepository rentalOrderRepository;
  RentalOrderMapper rentalOrderMapper;
  ProductClients productClients;

  @Override
  @Transactional(readOnly = true)
  public PagedItemsResponse<RentalOrderResponse> listOrders(
      Integer page,
      Integer pageSize,
      RentalOrderStatus status,
      String buyerProfileId,
      String sellerProfileId) {
    int normalizedPage = normalizePage(page);
    int normalizedSize = normalizePageSize(pageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

    String trimmedBuyerProfileId = trimToNull(buyerProfileId);
    String trimmedSellerProfileId = trimToNull(sellerProfileId);

    Page<RentalOrder> orderPage;
    if (StringUtils.hasText(trimmedSellerProfileId)) {
      List<String> variantIds = productClients.listListingVariantIdsForOwnerAdmin(trimmedSellerProfileId);
      if (variantIds.isEmpty()) {
        return emptyPage(normalizedPage, normalizedSize);
      }
      orderPage = rentalOrderRepository.findAdminPageByListingVariantIdIn(status, variantIds, pageable);
    } else if (StringUtils.hasText(trimmedBuyerProfileId)) {
      orderPage = rentalOrderRepository.findAdminPageByBuyerProfileId(status, trimmedBuyerProfileId, pageable);
    } else {
      orderPage = rentalOrderRepository.findAdminPage(status, pageable);
    }

    List<RentalOrderResponse> items = orderPage.getContent().stream()
        .map(order -> rentalOrderMapper.toRentalOrderResponse(order, order.getCustomer()))
        .filter(Objects::nonNull)
        .toList();

    return PagedItemsResponse.<RentalOrderResponse>builder()
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .totalCount(orderPage.getTotalElements())
        .items(items)
        .build();
  }

  private static PagedItemsResponse<RentalOrderResponse> emptyPage(int page, int pageSize) {
    return PagedItemsResponse.<RentalOrderResponse>builder()
        .page(page)
        .pageSize(pageSize)
        .totalCount(0)
        .items(List.of())
        .build();
  }

  private static String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }

  private static int normalizePage(Integer page) {
    if (page == null || page < 0) {
      return 0;
    }
    return page;
  }

  private int normalizePageSize(Integer pageSize) {
    if (pageSize == null || pageSize < 1) {
      return defaultPageSize;
    }
    return Math.min(pageSize, 100);
  }
}
