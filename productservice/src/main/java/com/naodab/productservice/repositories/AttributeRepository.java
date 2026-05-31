package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.naodab.productservice.models.Attribute;

public interface AttributeRepository extends JpaRepository<Attribute, String> {

  boolean existsByName(String name);

  Optional<Attribute> findByName(String name);

  @Query("SELECT DISTINCT a FROM Attribute a LEFT JOIN FETCH a.attributeValues ORDER BY a.name")
  List<Attribute> findAllWithValues();
}
