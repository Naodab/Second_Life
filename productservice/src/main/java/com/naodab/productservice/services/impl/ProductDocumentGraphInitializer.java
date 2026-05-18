package com.naodab.productservice.services.impl;

import org.hibernate.Hibernate;

import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;

final class ProductDocumentGraphInitializer {

  private ProductDocumentGraphInitializer() {
  }

  static void initialize(Product product) {
    if (product == null) {
      return;
    }
    initializePrimarySubCategory(product);
    initializeProductSubCategories(product);
    initializeMedias(product);
    initializeVariants(product);
  }

  private static void initializePrimarySubCategory(Product product) {
    if (product.getPrimarySubCategory() != null) {
      Hibernate.initialize(product.getPrimarySubCategory());
      Hibernate.initialize(product.getPrimarySubCategory().getCategory());
    }
  }

  private static void initializeProductSubCategories(Product product) {
    if (product.getProductSubCategories() == null) {
      return;
    }
    Hibernate.initialize(product.getProductSubCategories());
    for (ProductSubCategory link : product.getProductSubCategories()) {
      Hibernate.initialize(link.getSubCategory());
      if (link.getSubCategory() != null) {
        Hibernate.initialize(link.getSubCategory().getCategory());
      }
    }
  }

  private static void initializeMedias(Product product) {
    if (product.getMedias() != null) {
      Hibernate.initialize(product.getMedias());
    }
  }

  private static void initializeVariants(Product product) {
    if (product.getVariants() == null) {
      return;
    }
    Hibernate.initialize(product.getVariants());
    for (ProductVariant variant : product.getVariants()) {
      initializeVariantAttributeGraph(variant);
    }
  }

  private static void initializeVariantAttributeGraph(ProductVariant variant) {
    Hibernate.initialize(variant.getVariantAttributeValues());
    if (variant.getVariantAttributeValues() == null) {
      return;
    }
    for (ProductVariantAttributeValue vav : variant.getVariantAttributeValues()) {
      Hibernate.initialize(vav.getAttributeValue());
      if (vav.getAttributeValue() != null) {
        Hibernate.initialize(vav.getAttributeValue().getAttribute());
      }
    }
  }
}
