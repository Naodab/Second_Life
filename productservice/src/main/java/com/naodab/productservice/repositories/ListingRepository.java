package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.Listing;

public interface ListingRepository extends JpaRepository<Listing, String> {

  @Query(value = """
      SELECT l.id FROM Listing l
      JOIN l.product p
      WHERE p.deletedAt IS NULL
      ORDER BY l.id ASC
      """,
      countQuery = """
          SELECT COUNT(l) FROM Listing l
          JOIN l.product p
          WHERE p.deletedAt IS NULL
          """)
  Page<String> findIdsForOpenSearchReindex(Pageable pageable);

  @EntityGraph(attributePaths = {
      "product",
      "facility",
      "product.primarySubCategory",
      "product.primarySubCategory.category",
  })
  @Query("select l from Listing l where l.id = :id")
  Optional<Listing> findWithProductGraphById(@Param("id") String id);

  @Query("select l.id from Listing l join l.product p where p.id = :productId and p.deletedAt is null")
  List<String> findIdsByProductId(@Param("productId") String productId);

  @Query("select l.id from Listing l where l.product.id = :productId")
  List<String> findListingIdsByProductId(@Param("productId") String productId);

  @Query(
      value = "select l.id from Listing l order by l.id asc",
      countQuery = "select count(l) from Listing l")
  Page<String> findAllListingIds(Pageable pageable);

  @Query("""
      SELECT COUNT(l) FROM Listing l
      JOIN l.facility f
      WHERE f.ownerId = :ownerId AND f.deletedAt IS NULL
      """)
  long countByFacilityOwnerIdAndFacilityDeletedAtIsNull(@Param("ownerId") String ownerId);

  @Query(value = """
      SELECT l FROM Listing l
      JOIN FETCH l.product p
      JOIN FETCH l.facility f
      WHERE f.ownerId = :ownerId AND f.deletedAt IS NULL
        AND (:listingStatus IS NULL OR l.listingStatus = :listingStatus)
      ORDER BY l.id DESC
      """,
      countQuery = """
      SELECT COUNT(l) FROM Listing l
      JOIN l.facility f
      WHERE f.ownerId = :ownerId AND f.deletedAt IS NULL
        AND (:listingStatus IS NULL OR l.listingStatus = :listingStatus)
      """)
  Page<Listing> findAdminPageByOwnerId(
      @Param("ownerId") String ownerId,
      @Param("listingStatus") Listing.ListingStatus listingStatus,
      Pageable pageable);
}
