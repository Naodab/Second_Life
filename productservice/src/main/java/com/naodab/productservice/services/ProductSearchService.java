package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.PrimarySubcategorySummaryResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.documents.ProductDocument;
public interface ProductSearchService {
  void sync(String productId);

  int reindexAllProductsFromDatabase();

  void delete(String productId);

  List<ProductDocument> searchProducts(ProductSearchRequest request);

  List<ProductItemResponse> searchProductItems(ProductSearchRequest request);

  PagedItemsResponse<ProductItemResponse> listOwnedProductItems(ProductSearchRequest request);

  List<PrimarySubcategorySummaryResponse> listOwnedPrimarySubcategorySummaries(String ownerId);
}
