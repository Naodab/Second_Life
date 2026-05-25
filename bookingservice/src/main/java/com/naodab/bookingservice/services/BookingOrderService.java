package com.naodab.bookingservice.services;

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;

public interface BookingOrderService {

  BookingOrderResponse createBookingOrder(String profileId, BookingOrderCreateRequest request);

  void deleteBookingOrder(String id);

}
