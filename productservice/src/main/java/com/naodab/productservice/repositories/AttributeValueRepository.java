package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.productservice.models.AttributeValue;

public interface AttributeValueRepository extends JpaRepository<AttributeValue, String> {

  boolean existsByValue(String value);

  Optional<AttributeValue> findByValue(String value);

  Optional<AttributeValue> findByAttributeIdAndValue(String attributeId, String value);

  boolean existsByAttributeIdAndValue(String attributeId, String value);

  List<AttributeValue> findByAttributeId(String attributeId);
}
