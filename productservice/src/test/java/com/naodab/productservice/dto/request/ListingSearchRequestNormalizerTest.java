package com.naodab.productservice.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class ListingSearchRequestNormalizerTest {

  @Test
  void normalizeCategoryScope_subCategoryWinsAndClearsCategory() {
    ListingSearchRequest r = ListingSearchRequest.builder()
        .categoryId("cat-1")
        .categoryIds(List.of("cat-2", "cat-3"))
        .subCategoryId("sub-1")
        .subCategoryIds(List.of("sub-2"))
        .build();

    ListingSearchRequestNormalizer.normalizeCategoryScope(r);

    assertThat(r.getSubCategoryId()).isEqualTo("sub-1");
    assertThat(r.getCategoryId()).isNull();
  }

  @Test
  void normalizeCategoryScope_keepsFirstCategoryWhenNoSubCategory() {
    ListingSearchRequest r = ListingSearchRequest.builder()
        .categoryIds(List.of("cat-a", "cat-b"))
        .build();

    ListingSearchRequestNormalizer.normalizeCategoryScope(r);

    assertThat(r.getCategoryId()).isEqualTo("cat-a");
    assertThat(r.getSubCategoryId()).isNull();
  }

  @Test
  void normalizeCategoryScope_clearsWhenEmpty() {
    ListingSearchRequest r = ListingSearchRequest.builder()
        .categoryIds(List.of("  ", ""))
        .subCategoryIds(List.of())
        .build();

    ListingSearchRequestNormalizer.normalizeCategoryScope(r);

    assertThat(r.getCategoryId()).isNull();
    assertThat(r.getSubCategoryId()).isNull();
  }
}
