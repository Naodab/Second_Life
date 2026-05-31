package com.naodab.bookingservice.dto.request;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class RentalOrderCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  String listingVariantId;

  @NotBlank(message = "REQUIRED_FIELD")
  String customerId;

  @NotNull(message = "REQUIRED_FIELD")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime startTime;

  @NotNull(message = "REQUIRED_FIELD")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime endTime;

  @NotNull(message = "REQUIRED_FIELD")
  @Min(value = 1, message = "QUANTITY_MIN")
  Integer quantity;
}
