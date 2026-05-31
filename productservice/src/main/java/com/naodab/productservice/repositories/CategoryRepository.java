package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.naodab.productservice.models.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
  boolean existsByName(String name);

  Optional<Category> findByName(String name);

  @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.subCategories ORDER BY c.name")
  List<Category> findAllWithSubCategories();
}
