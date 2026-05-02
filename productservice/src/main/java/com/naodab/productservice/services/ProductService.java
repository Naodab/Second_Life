package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.dto.response.ProductVariantSummaryResponse;

public interface ProductService {

  ProductResponse createProduct(String profileId, ProductCreateRequest request);

  ProductResponse updateProduct(String profileId, String id, ProductUpdateRequest request);

  ProductResponse getProductById(String id);

  ProductResponse getOwnedProductWithVariants(String profileId, String productId);

  void uploadProductImages(
      String profileId,
      String id,
      String thumbnailUrl,
      List<String> productImageUrls,
      String videoUrl);

  List<ProductVariantSummaryResponse> getProductVariants(String profileId, String productId);

  void deleteProduct(String id);
}
