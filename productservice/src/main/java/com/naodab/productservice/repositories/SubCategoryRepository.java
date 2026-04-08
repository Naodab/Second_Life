package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.productservice.models.SubCategory;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, String> {
  boolean existsByName(String name);

  Optional<SubCategory> findByName(String name);

  List<SubCategory> findByCategoryId(String categoryId);
}
