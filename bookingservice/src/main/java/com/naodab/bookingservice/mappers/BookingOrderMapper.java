package com.naodab.bookingservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.Customer;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderMapper {

  CustomerMapper customerMapper;

  public BookingOrder toBookingOrder(Customer customer, BookingOrderCreateRequest request) {
    return BookingOrder.builder()
        .customer(customer)
        .listingVariantId(request.getListingVariantId())
        .quantity(request.getQuantity())
        .pickupTime(request.getPickupTime())
        .build();
  }

  public BookingOrderResponse toBookingOrderResponse(BookingOrder bookingOrder, Customer customer) {
    Customer resolved = customer != null ? customer : bookingOrder.getCustomer();
    return BookingOrderResponse.builder()
        .id(bookingOrder.getId())
        .customerId(resolved != null ? resolved.getId() : null)
        .customer(resolved == null ? null : customerMapper.toResponse(resolved))
        .listingVariantId(bookingOrder.getListingVariantId())
        .quantity(bookingOrder.getQuantity())
        .pickupTime(bookingOrder.getPickupTime())
        .status(bookingOrder.getStatus())
        .build();
  }
}
