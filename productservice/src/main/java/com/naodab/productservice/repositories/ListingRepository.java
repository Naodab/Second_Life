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
  Page<String> findIdsForElasticsearchReindex(Pageable pageable);

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
}
