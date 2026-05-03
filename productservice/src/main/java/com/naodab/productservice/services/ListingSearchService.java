package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.Listing;

public interface ListingSearchService {
  void sync(Listing listing);

  /** Reindexes every listing tied to {@code productId} (after product embedded fields change in ES snapshots). */
  void reindexAllListingsForProduct(String productId);

  /** Removes all listing documents for the product (e.g. after product soft-delete). */
  void deleteListingsIndexByProductId(String productId);

  void delete(String listingId);

  List<ListingDocument> searchListings(ListingSearchRequest request);
}
