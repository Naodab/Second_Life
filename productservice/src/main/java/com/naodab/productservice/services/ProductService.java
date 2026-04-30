package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import java.util.List;

public interface ProductService {
  ProductResponse createProduct(String profileId, ProductCreateRequest request);

  ProductResponse updateProduct(String profileId, String id, ProductUpdateRequest request);

  ProductResponse getProductById(String id);

  void uploadProductImages(String profileId, String id, String thumbnailUrl, List<String> productImageUrls);

  void deleteProduct(String id);
}
