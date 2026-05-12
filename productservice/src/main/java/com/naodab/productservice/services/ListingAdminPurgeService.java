package com.naodab.productservice.services;

import com.naodab.productservice.dto.response.AdminListingPurgeResponse;

public interface ListingAdminPurgeService {

  /**
   * Purges inventory (when {@code external.inventory-service.url} is set), removes all listing documents from
   * Elasticsearch, then deletes all listing_variants and listings rows.
   */
  AdminListingPurgeResponse purgeAllListingsAndSearchIndexAndRemoteInventory(String adminJwtRoleHeader);
}
