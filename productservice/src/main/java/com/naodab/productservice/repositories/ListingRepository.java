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

  @EntityGraph(attributePaths = { "product", "product.medias", "product.primarySubCategory" })
  @Query(value = """
      SELECT DISTINCT l FROM Listing l
      JOIN l.product p
      LEFT JOIN p.variants v
      WHERE p.facility.id = :facilityId AND p.deletedAt IS NULL
      AND (:productId IS NULL OR p.id = :productId)
      AND (
        :keyword IS NULL
        OR LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(l.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(v.sku, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
      )
      ORDER BY l.id DESC
      """, countQuery = """
      SELECT COUNT(DISTINCT l.id) FROM Listing l
      JOIN l.product p
      LEFT JOIN p.variants v
      WHERE p.facility.id = :facilityId AND p.deletedAt IS NULL
      AND (:productId IS NULL OR p.id = :productId)
      AND (
        :keyword IS NULL
        OR LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(l.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(v.sku, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
      )
      """)
  Page<Listing> findSellerItemsByFacilityIdPageFiltered(
      @Param("facilityId") String facilityId,
      @Param("keyword") String keyword,
      @Param("productId") String productId,
      Pageable pageable);

  @EntityGraph(attributePaths = {
      "product",
      "product.facility",
      "product.primarySubCategory",
      "product.primarySubCategory.category",
  })
  @Query("select l from Listing l where l.id = :id")
  Optional<Listing> findWithProductGraphById(@Param("id") String id);

  @Query("select l.id from Listing l join l.product p where p.id = :productId and p.deletedAt is null")
  List<String> findIdsByProductId(@Param("productId") String productId);

  @Query("select l.id from Listing l where l.product.id = :productId")
  List<String> findListingIdsByProductId(@Param("productId") String productId);
}
