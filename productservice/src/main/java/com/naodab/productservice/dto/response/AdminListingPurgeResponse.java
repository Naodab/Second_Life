package com.naodab.productservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AdminListingPurgeResponse {

  long listingRowsRemoved;

  long listingVariantRowsRemoved;

  long listingSearchDocumentsRemoved;

  Long inventoryReservationsRemoved;

  Long inventoryItemsRemoved;

  @Builder.Default
  boolean inventoryServiceInvoked = false;
}
