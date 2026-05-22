package com.naodab.bookingservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.BookingOrder;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderMapper {

  public BookingOrder toBookingOrder(String customerId, BookingOrderCreateRequest request) {
    return BookingOrder.builder()
        .customerId(customerId)
        .listingVariantId(request.getListingVariantId())
        .quantity(request.getQuantity())
        .pickupTime(request.getPickupTime())
        .build();
  }

  public BookingOrderResponse toBookingOrderResponse(BookingOrder bookingOrder) {
    return BookingOrderResponse.builder()
        .id(bookingOrder.getId())
        .customerId(bookingOrder.getCustomerId())
        .listingVariantId(bookingOrder.getListingVariantId())
        .quantity(bookingOrder.getQuantity())
        .pickupTime(bookingOrder.getPickupTime())
        .status(bookingOrder.getStatus())
        .build();
  }
}
