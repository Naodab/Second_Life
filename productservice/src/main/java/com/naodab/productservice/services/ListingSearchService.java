package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.Listing;

public interface ListingSearchService {
  void sync(Listing listing);

  void delete(String listingId);

  List<ListingDocument> searchListings(ListingSearchRequest request);
}
