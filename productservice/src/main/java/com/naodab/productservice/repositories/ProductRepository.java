package com.naodab.productservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.productservice.models.Product;

public interface ProductRepository extends JpaRepository<Product, String> {
  boolean existsByFacilityIdAndDeletedAtIsNull(String facilityId);

  Optional<Product> findByIdAndDeletedAtIsNull(String id);
}
