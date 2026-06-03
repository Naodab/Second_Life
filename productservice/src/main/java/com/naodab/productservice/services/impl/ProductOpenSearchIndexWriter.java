package com.naodab.productservice.services.impl;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.repositories.ProductRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductOpenSearchIndexWriter {

  static final IndexCoordinates PRODUCT_INDEX = IndexCoordinates.of("products");

  ProductRepository productRepository;
  ProductMapper productMapper;
  ElasticsearchOperations openSearchOperations;

  @Transactional(readOnly = true)
  public void writeProductDocumentById(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(productId.trim()).orElse(null);
    if (product == null) {
      return;
    }

    ProductDocumentGraphInitializer.initialize(product);

    var doc = productMapper.toProductDocument(product);
    if (doc != null && doc.getId() != null) {
      openSearchOperations.save(doc, PRODUCT_INDEX);
    }
  }
}
