package com.naodab.productservice.services.impl;

import java.util.Optional;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingOpenSearchIndexWriter {

  static final IndexCoordinates LISTING_INDEX = IndexCoordinates.of("listings");

  ListingRepository listingRepository;
  ListingVariantRepository listingVariantRepository;
  ListingMapper listingMapper;
  ElasticsearchOperations openSearchOperations;

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
      openSearchOperations.delete(listingId.trim(), LISTING_INDEX);
      return;
    }

    ProductDocumentGraphInitializer.initialize(listing.getProduct());

    java.util.List<ListingVariant> listingVariants = listingVariantRepository.findByListing_Id(listing.getId());
    var doc = listingMapper.toListingDocument(listing, listingVariants);
    if (doc != null && doc.getId() != null) {
      openSearchOperations.save(doc, LISTING_INDEX);
    }
  }
}
