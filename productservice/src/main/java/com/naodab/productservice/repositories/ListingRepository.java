package com.naodab.productservice.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.Listing;

public interface ListingRepository extends JpaRepository<Listing, String> {

  @EntityGraph(attributePaths = { "product", "product.medias", "product.primarySubCategory" })
  @Query(value = """
      SELECT l FROM Listing l
      WHERE l.product.facility.id = :facilityId AND l.product.deletedAt IS NULL
      ORDER BY l.id DESC
      """, countQuery = """
      SELECT COUNT(l) FROM Listing l
      WHERE l.product.facility.id = :facilityId AND l.product.deletedAt IS NULL
      """)
  Page<Listing> findSellerItemsByFacilityIdPage(@Param("facilityId") String facilityId, Pageable pageable);

  @EntityGraph(attributePaths = {
      "product",
      "product.facility",
      "product.primarySubCategory",
      "product.primarySubCategory.category",
  })
  @Query("select l from Listing l where l.id = :id")
  Optional<Listing> findWithProductGraphById(@Param("id") String id);
}
