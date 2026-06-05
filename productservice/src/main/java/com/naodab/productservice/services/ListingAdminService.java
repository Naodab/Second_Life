package com.naodab.productservice.services;

import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;

public interface ListingAdminService {

  PagedItemsResponse<ListingItemResponse> listPendingListings(Integer page, Integer pageSize);

  ListingResponse approveListing(String listingId);

  ListingResponse rejectListing(String listingId);
}
