package com.naodab.productservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.commonjpa.entity.BaseEntity;

@Entity
@Table(name = "product_variant_attribute_values", indexes = {
    @Index(name = "idx_product_variant_id", columnList = "product_variant_id"),
    @Index(name = "idx_attribute_value_id", columnList = "attribute_value_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductVariantAttributeValue extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne
  @JoinColumn(name = "product_variant_id", nullable = false)
  ProductVariant productVariant;

  @ManyToOne
  @JoinColumn(name = "attribute_value_id", nullable = false)
  AttributeValue attributeValue;
}
