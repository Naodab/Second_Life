package com.naodab.productservice.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;

import java.util.List;

import com.naodab.commonjpa.entity.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_facility_id", columnList = "facility_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Product extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  String name;

  @Column(length = 8096)
  String description;

  @ManyToOne
  @JoinColumn(name = "facility_id", nullable = false)
  Facility facility;

  @ManyToMany
  @JoinTable(name = "product_sub_categories", joinColumns = @JoinColumn(name = "product_id"), inverseJoinColumns = @JoinColumn(name = "sub_category_id"), indexes = {
      @Index(name = "idx_product_id", columnList = "product_id"),
      @Index(name = "idx_sub_category_id", columnList = "sub_category_id"),
  })
  List<SubCategory> subCategories;

  @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
  List<ProductMedia> medias;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  ProductStatus status = ProductStatus.DRAFT;

  public enum ProductStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED,
  }
}
