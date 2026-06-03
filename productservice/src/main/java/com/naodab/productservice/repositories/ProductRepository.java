package com.naodab.productservice.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.Product;

public interface ProductRepository extends JpaRepository<Product, String> {
  Optional<Product> findByIdAndDeletedAtIsNull(String id);

  @Query("""
      SELECT DISTINCT p FROM Product p
      LEFT JOIN FETCH p.variants v
      WHERE p.id = :id AND p.deletedAt IS NULL""")
  Optional<Product> findByIdWithVariantsGraph(@Param("id") String id);

  @Query(value = "SELECT p.id FROM Product p WHERE p.deletedAt IS NULL ORDER BY p.id", countQuery = "SELECT count(p) FROM Product p WHERE p.deletedAt IS NULL")
  Page<String> findIdsForOpenSearchReindex(Pageable pageable);

  @EntityGraph(attributePaths = {
      "primarySubCategory",
      "primarySubCategory.category",
      "productSubCategories",
      "productSubCategories.subCategory",
      "productSubCategories.subCategory.category",
  })
  @Query("SELECT p FROM Product p WHERE p.id IN :ids")
  List<Product> findAllByIdInWithOpenSearchGraph(@Param("ids") Collection<String> ids);
}
