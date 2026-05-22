package com.naodab.bookingservice.clients.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ListingVariantAvailabilityDto {

  boolean tracked;

  Long availableQuantity;
}
