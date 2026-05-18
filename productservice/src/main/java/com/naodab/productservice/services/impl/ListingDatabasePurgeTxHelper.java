package com.naodab.productservice.services.impl;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingDatabasePurgeTxHelper {

  ListingVariantRepository listingVariantRepository;
  ListingRepository listingRepository;

  @Transactional
  public void deleteAllVariantsThenListings() {
    listingVariantRepository.deleteAllInBatch();
    listingRepository.deleteAllInBatch();
  }
}
