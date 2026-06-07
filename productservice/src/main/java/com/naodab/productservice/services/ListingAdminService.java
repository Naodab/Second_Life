package com.naodab.productservice.services;

import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.models.Listing.ListingStatus;

public interface ListingAdminService {

  PagedItemsResponse<ListingItemResponse> listPendingListings(Integer page, Integer pageSize);

  PagedItemsResponse<ListingItemResponse> listListingsByOwner(
      String ownerId, Integer page, Integer pageSize, ListingStatus listingStatus);

  ListingResponse approveListing(String listingId);

  ListingResponse rejectListing(String listingId);

  ListingResponse suspendListing(String listingId);

  ListingResponse reactivateListing(String listingId);
}
