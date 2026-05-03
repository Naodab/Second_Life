package com.naodab.productservice.services.impl;

import java.util.Optional;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.repositories.ListingRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Loads a listing (+ product graph) and initializes Hibernate associations needed for
 * {@link ListingMapper#toListingDocument}, then saves to Elasticsearch in the caller's transaction boundary.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingElasticsearchIndexWriter {

  static final IndexCoordinates LISTING_INDEX = IndexCoordinates.of("listings");

  ListingRepository listingRepository;
  ListingMapper listingMapper;
  ElasticsearchOperations elasticsearchOperations;

  @Transactional(readOnly = true)
  public void writeListingDocumentById(String listingId) {
    if (!StringUtils.hasText(listingId)) {
      return;
    }

    Optional<Listing> opt = listingRepository.findWithProductGraphById(listingId.trim());
    if (opt.isEmpty()) {
      return;
    }

    Listing listing = opt.get();
    if (listing.getProduct() != null && listing.getProduct().getDeletedAt() != null) {
      elasticsearchOperations.delete(listingId.trim(), LISTING_INDEX);
      return;
    }

    ProductDocumentGraphInitializer.initialize(listing.getProduct());

    var doc = listingMapper.toListingDocument(listing);
    if (doc != null && doc.getId() != null) {
      elasticsearchOperations.save(doc, LISTING_INDEX);
    }
  }
}
