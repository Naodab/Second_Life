package com.naodab.bookingservice.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import com.fasterxml.jackson.annotation.JsonFormat;
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
public class BookingOrderCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  String listingVariantId;

  @NotNull(message = "REQUIRED_FIELD")
  @Min(value = 1, message = "QUANTITY_MIN")
  Integer quantity;

  @NotNull(message = "REQUIRED_FIELD")
  @Future(message = "PICKUP_TIME_FUTURE")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime pickupTime;
}
