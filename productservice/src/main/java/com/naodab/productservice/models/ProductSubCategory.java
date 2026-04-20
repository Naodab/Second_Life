package com.naodab.productservice.models;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "product_sub_categories", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_sub_category_id", columnList = "sub_category_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductSubCategory {
  @EmbeddedId
  @AttributeOverrides({
      @AttributeOverride(name = "productId", column = @Column(name = "product_id", nullable = false)),
      @AttributeOverride(name = "subCategoryId", column = @Column(name = "sub_category_id", nullable = false)),
  })
  ProductSubCategoryId id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @MapsId("productId")
  @JoinColumn(name = "product_id")
  Product product;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @MapsId("subCategoryId")
  @JoinColumn(name = "sub_category_id")
  SubCategory subCategory;
}
