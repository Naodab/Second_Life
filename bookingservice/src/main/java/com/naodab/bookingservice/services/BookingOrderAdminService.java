package com.naodab.bookingservice.services;

import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.commonservice.response.PagedItemsResponse;

public interface BookingOrderAdminService {
  PagedItemsResponse<BookingOrderResponse> listOrders(Integer page, Integer pageSize, BookingOrderStatus status);
}
