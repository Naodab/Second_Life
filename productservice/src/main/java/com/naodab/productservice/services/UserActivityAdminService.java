package com.naodab.productservice.services;

import com.naodab.productservice.dto.response.UserSellerActivityCountsResponse;

public interface UserActivityAdminService {
  UserSellerActivityCountsResponse getSellerActivityCounts(String profileId);

  java.util.List<String> listListingVariantIdsForOwner(String profileId);
}
