package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingUpdateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;

import java.util.List;

public interface ListingService {

  ListingResponse createListing(String profileId, ListingCreateRequest request);

  ListingResponse updateListing(String profileId, String listingId, ListingUpdateRequest request);

  /** Marketplace search (Elasticsearch); defaults to active + published only. */
  List<ListingItemResponse> searchPublicListingItems(ListingSearchRequest request);

  PagedItemsResponse<ListingItemResponse> listListingItemsForFacility(
      String profileId,
      String facilityId,
      Integer page,
      Integer pageSize,
      String keyword,
      String productId);
}
