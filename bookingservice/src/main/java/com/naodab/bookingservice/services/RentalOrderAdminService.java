package com.naodab.bookingservice.services;

import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.commonservice.response.PagedItemsResponse;

public interface RentalOrderAdminService {
  PagedItemsResponse<RentalOrderResponse> listOrders(Integer page, Integer pageSize, RentalOrderStatus status);
}
