package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.models.Product;

public interface ProductSearchService {
  void sync(Product product);

  void delete(String productId);

  List<String> searchProductIds(ProductSearchRequest request);
}
