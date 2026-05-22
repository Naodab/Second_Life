package com.naodab.productservice.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.productservice.models.ListingVariant;

public interface ListingVariantRepository extends JpaRepository<ListingVariant, String> {

  List<ListingVariant> findByListing_Id(String listingId);

  boolean existsByProductVariantId(String productVariantId);

  boolean existsByIdAndListing_Id(String id, String listingId);
}
