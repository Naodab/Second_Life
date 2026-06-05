package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.ListingVariant;

public interface ListingVariantRepository extends JpaRepository<ListingVariant, String> {

  List<ListingVariant> findByListing_Id(String listingId);

  boolean existsByProductVariantId(String productVariantId);

  @Query("SELECT lv.id FROM ListingVariant lv WHERE lv.listing.facility.id = :facilityId")
  List<String> findIdsByFacilityId(@Param("facilityId") String facilityId);

  @Query("""
      SELECT lv.id FROM ListingVariant lv
      WHERE lv.listing.facility.ownerId = :ownerId
      AND lv.listing.facility.deletedAt IS NULL
      """)
  List<String> findIdsByOwnerId(@Param("ownerId") String ownerId);

  boolean existsByIdAndListing_Id(String id, String listingId);

  @Query("""
      SELECT lv.listing.facility.ownerId FROM ListingVariant lv
      WHERE lv.id = :id
      AND lv.deletedAt IS NULL
      AND lv.listing.facility.deletedAt IS NULL
      """)
  Optional<String> findOwnerIdById(@Param("id") String id);
}
