package com.naodab.bookingservice.services.impl;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.services.BookingOrderAdminService;
import com.naodab.commonservice.response.PagedItemsResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderAdminServiceImpl implements BookingOrderAdminService {

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  BookingOrderRepository bookingOrderRepository;
  BookingOrderMapper bookingOrderMapper;

  @Override
  @Transactional(readOnly = true)
  public PagedItemsResponse<BookingOrderResponse> listOrders(
      Integer page,
      Integer pageSize,
      BookingOrderStatus status) {
    int normalizedPage = normalizePage(page);
    int normalizedSize = normalizePageSize(pageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

    Page<BookingOrder> orderPage = bookingOrderRepository.findAdminPage(status, pageable);
    List<BookingOrderResponse> items = orderPage.getContent().stream()
        .map(order -> bookingOrderMapper.toBookingOrderResponse(order, order.getCustomer()))
        .filter(Objects::nonNull)
        .toList();

    return PagedItemsResponse.<BookingOrderResponse>builder()
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .totalCount(orderPage.getTotalElements())
        .items(items)
        .build();
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
