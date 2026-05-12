package com.naodab.inventoryservice.dto.response;

import java.time.Instant;

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
public class ListingVariantIntervalAvailabilityResponse {

  boolean tracked;

  Long availableQuantity;

  Instant intervalStart;

  Instant intervalEnd;
}
