package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.Listing;

public interface ListingSearchService {
  record ListingDocumentPage(List<ListingDocument> items, long totalCount) {
  }

  void sync(Listing listing);

  int reindexAllListingsFromDatabase();

  void reindexAllListingsForProduct(String productId);

  void deleteListingsIndexByProductId(String productId);

  void delete(String listingId);

  /** Deletes every listing document from the search index (uses DB ids first; call before removing listing rows). */
  long removeAllListingDocumentsFromIndex();

  ListingDocumentPage searchListingsPaged(ListingSearchRequest request);

  List<ListingDocument> searchListings(ListingSearchRequest request);
}
