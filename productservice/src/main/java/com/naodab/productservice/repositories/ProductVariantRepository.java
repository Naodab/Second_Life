package com.naodab.productservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.productservice.models.ProductVariant;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

  Optional<ProductVariant> findByIdAndProduct_IdAndDeletedAtIsNull(String id, String productId);
}
