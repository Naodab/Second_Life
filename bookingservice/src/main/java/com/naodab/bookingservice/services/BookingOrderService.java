package com.naodab.bookingservice.services;

import java.util.List;

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.request.BookingOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;

public interface BookingOrderService {

  BookingOrderResponse createBookingOrder(String profileId, BookingOrderCreateRequest request);

  List<BookingOrderResponse> listBookingOrders(String profileId);

  List<BookingOrderResponse> listFacilityOrders(String profileId, String facilityId);

  BookingOrderResponse updateBookingOrderStatus(String profileId, String id, BookingOrderStatusUpdateRequest request);

  void cancelBookingOrder(String profileId, String id);

}
