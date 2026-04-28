package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.response.ProductResponse;

public interface ProductService {
  ProductResponse createProduct(ProductCreateRequest request);

  ProductResponse getProductById(String id);

  void deleteProduct(String id);
}
