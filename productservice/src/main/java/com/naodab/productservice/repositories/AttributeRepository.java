package com.naodab.productservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import com.naodab.productservice.models.Attribute;

public interface AttributeRepository extends JpaRepository<Attribute, String> {

  boolean existsByName(String name);

  Optional<Attribute> findByName(String name);
}
