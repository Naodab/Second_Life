package com.naodab.productservice.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;

@Component
public class ProductVariantMapper {
  public List<ProductVariantAttributeValue> toVariantAttributeValues(
      ProductVariant productVariant,
      List<AttributeValue> attributeValues) {
    return attributeValues.stream()
        .map(attributeValue -> ProductVariantAttributeValue.builder()
            .productVariant(productVariant)
            .attributeValue(attributeValue)
            .build())
        .toList();
  }
}
