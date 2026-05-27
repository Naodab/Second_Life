package com.naodab.bookingservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.RentalOrder;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RentalOrderMapper {

  CustomerMapper customerMapper;

  public RentalOrder toRentalOrder(Customer customer, RentalOrderCreateRequest request) {
    return RentalOrder.builder()
        .customer(customer)
        .listingVariantId(request.getListingVariantId())
        .quantity(request.getQuantity())
        .startTime(request.getStartTime())
        .endTime(request.getEndTime())
        .build();
  }

  public RentalOrderResponse toRentalOrderResponse(RentalOrder order, Customer customer) {
    Customer resolved = customer != null ? customer : order.getCustomer();
    return RentalOrderResponse.builder()
        .id(order.getId())
        .customerId(resolved != null ? resolved.getId() : null)
        .customer(resolved == null ? null : customerMapper.toResponse(resolved))
        .listingVariantId(order.getListingVariantId())
        .quantity(order.getQuantity())
        .startTime(order.getStartTime())
        .endTime(order.getEndTime())
        .price(order.getPrice())
        .status(order.getStatus())
        .createdAt(order.getCreatedAt())
        .build();
  }
}
