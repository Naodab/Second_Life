package com.naodab.bookingservice.dto.response;

import java.time.LocalDateTime;

import com.naodab.bookingservice.models.enums.RentalOrderStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class RentalOrderResponse {
  String id;
  String customerId;
  BookingOrderCustomerResponse customer;
  String listingVariantId;
  Long price;
  Integer quantity;
  LocalDateTime endTime;
  LocalDateTime startTime;
  RentalOrderStatus status;
  LocalDateTime createdAt;
}
