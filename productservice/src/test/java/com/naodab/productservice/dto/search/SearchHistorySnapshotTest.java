package com.naodab.productservice.dto.search;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.request.ListingSearchRequestNormalizer;

class SearchHistorySnapshotTest {

  @Test
  void fromNormalizedSearch_keepsSingularCategoryAfterNormalize() {
    ListingSearchRequest r = ListingSearchRequest.builder()
        .keyword("áo len")
        .categoryId("cat-1")
        .build();
    ListingSearchRequestNormalizer.normalizeCategoryScope(r);

    SearchHistorySnapshot snap = SearchHistorySnapshot.fromNormalizedSearch(r);

    assertThat(snap.getCategoryIds()).containsExactly("cat-1");
    assertThat(snap.isWorthRecording()).isTrue();
  }

  @Test
  void isWorthRecording_falseForBlankBrowse() {
    SearchHistorySnapshot snap = SearchHistorySnapshot.builder().build();
    assertThat(snap.isWorthRecording()).isFalse();
  }
}
