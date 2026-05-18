package com.naodab.productservice.services;

import com.naodab.productservice.dto.response.AdminListingPurgeResponse;

public interface ListingAdminPurgeService {

  AdminListingPurgeResponse purgeAllListingsAndSearchIndexAndRemoteInventory(String adminJwtRoleHeader);
}
