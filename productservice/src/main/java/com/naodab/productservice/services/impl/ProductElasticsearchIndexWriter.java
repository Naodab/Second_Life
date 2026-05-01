package com.naodab.productservice.services.impl;

import org.hibernate.Hibernate;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;
import com.naodab.productservice.repositories.ProductRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Loads a product and fully initializes lazy associations inside a transaction, then maps to a search document.
 * Must not pass a detached {@link Product} into {@code @Async} and then call {@link ProductMapper#toProductDocument}:
 * Hibernate collections then have no session (NPE in {@code PersistentBag}).
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductElasticsearchIndexWriter {

  static final IndexCoordinates PRODUCT_INDEX = IndexCoordinates.of("products");

  ProductRepository productRepository;
  ProductMapper productMapper;
  ElasticsearchOperations elasticsearchOperations;

  @Transactional(readOnly = true)
  public void writeProductDocumentById(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(productId.trim()).orElse(null);
    if (product == null) {
      return;
    }

    initializeForProductDocument(product);

    var doc = productMapper.toProductDocument(product);
    if (doc != null && doc.getId() != null) {
      elasticsearchOperations.save(doc, PRODUCT_INDEX);
    }
  }

  private static void initializeForProductDocument(Product product) {
    if (product.getFacility() != null) {
      Hibernate.initialize(product.getFacility());
    }

    if (product.getPrimarySubCategory() != null) {
      Hibernate.initialize(product.getPrimarySubCategory());
      Hibernate.initialize(product.getPrimarySubCategory().getCategory());
    }

    if (product.getProductSubCategories() != null) {
      Hibernate.initialize(product.getProductSubCategories());
      for (ProductSubCategory link : product.getProductSubCategories()) {
        Hibernate.initialize(link.getSubCategory());
        if (link.getSubCategory() != null) {
          Hibernate.initialize(link.getSubCategory().getCategory());
        }
      }
    }

    if (product.getMedias() != null) {
      Hibernate.initialize(product.getMedias());
    }

    if (product.getVariants() != null) {
      Hibernate.initialize(product.getVariants());
      for (ProductVariant variant : product.getVariants()) {
        Hibernate.initialize(variant.getVariantAttributeValues());
        if (variant.getVariantAttributeValues() == null) {
          continue;
        }
        for (ProductVariantAttributeValue vav : variant.getVariantAttributeValues()) {
          Hibernate.initialize(vav.getAttributeValue());
          if (vav.getAttributeValue() != null) {
            Hibernate.initialize(vav.getAttributeValue().getAttribute());
          }
        }
      }
    }
  }
}
