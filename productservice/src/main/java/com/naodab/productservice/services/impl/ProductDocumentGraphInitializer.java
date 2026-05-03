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
