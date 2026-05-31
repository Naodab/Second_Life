package com.naodab.productservice.dto.request;

public final class ListingSearchRequestNormalizer {

  private ListingSearchRequestNormalizer() {
  }

  public static void normalizeCategoryScope(ListingSearchRequest request) {
    if (request != null) {
      request.normalizeCategoryScope();
    }
  }
}
