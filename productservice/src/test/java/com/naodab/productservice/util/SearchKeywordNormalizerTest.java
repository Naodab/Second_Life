package com.naodab.productservice.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SearchKeywordNormalizerTest {

  @Test
  void normalize_collapsesWhitespaceAndTrims() {
    assertThat(SearchKeywordNormalizer.normalize("  máy   ảnh  ")).isEqualTo("máy ảnh");
    assertThat(SearchKeywordNormalizer.normalize("   ")).isNull();
    assertThat(SearchKeywordNormalizer.normalize(null)).isNull();
  }

  @Test
  void isMultiToken_detectsSpacesAfterNormalize() {
    assertThat(SearchKeywordNormalizer.isMultiToken("máy ảnh")).isTrue();
    assertThat(SearchKeywordNormalizer.isMultiToken("sony")).isFalse();
  }

  @Test
  void looksLikeSkuToken_matchesAlphanumericCodes() {
    assertThat(SearchKeywordNormalizer.looksLikeSkuToken("IP-13-128")).isTrue();
    assertThat(SearchKeywordNormalizer.looksLikeSkuToken("a")).isFalse();
    assertThat(SearchKeywordNormalizer.looksLikeSkuToken("máy ảnh")).isFalse();
  }

  @Test
  void escapeWildcard_escapesSpecialCharacters() {
    assertThat(SearchKeywordNormalizer.escapeWildcard("A*B?")).isEqualTo("A\\*B\\?");
    assertThat(SearchKeywordNormalizer.wildcardContainsPattern("ip-13"))
        .isEqualTo("*IP-13*");
  }
}
