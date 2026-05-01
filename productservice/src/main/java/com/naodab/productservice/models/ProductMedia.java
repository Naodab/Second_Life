package com.naodab.productservice.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.commonjpa.entity.BaseEntity;

@Entity
@Table(name = "product_media", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_sort_order", columnList = "sort_order"),
    @Index(name = "idx_is_thumbnail", columnList = "is_thumbnail"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductMedia extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne
  @JoinColumn(name = "product_id", nullable = false)
  Product product;

  @Column(name = "url", nullable = false, length = 2048)
  String mediaUrl;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  MediaType mediaType = MediaType.IMAGE;

  @Builder.Default
  Boolean isThumbnail = false;

  Integer sortOrder;

  public enum MediaType {
    IMAGE,
    VIDEO
  }
}
