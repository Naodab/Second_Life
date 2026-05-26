package com.naodab.bookingservice.dto.request;

import com.naodab.bookingservice.models.enums.BookingOrderStatus;

import jakarta.validation.constraints.NotNull;
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
public class BookingOrderStatusUpdateRequest {
  @NotNull
  BookingOrderStatus status;
}
