package com.naodab.productservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.productservice.models.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
  boolean existsByName(String name);

  Optional<Category> findByName(String name);
}
