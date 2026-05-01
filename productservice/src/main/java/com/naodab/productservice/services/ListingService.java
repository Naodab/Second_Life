package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;

public interface ListingService {

  ListingResponse createListing(String profileId, ListingCreateRequest request);

  PagedItemsResponse<ListingItemResponse> listListingItemsForFacility(
      String profileId, String facilityId, Integer page, Integer pageSize);
}
