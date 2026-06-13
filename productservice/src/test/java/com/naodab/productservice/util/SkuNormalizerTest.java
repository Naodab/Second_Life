package com.naodab.productservice.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SkuNormalizerTest {

  @Test
  void normalizePart_vietnameseProductName() {
    assertThat(SkuNormalizer.normalizePart("Áo thun nam cổ tròn", null))
        .isEqualTo("AO-THUN-NAM-CO-TRON");
    assertThat(SkuNormalizer.normalizePart("Điện thoại iPhone 15", null))
        .isEqualTo("DIEN-THOAI-IPHONE-15");
    assertThat(SkuNormalizer.normalizePart("Máy giặt LG Inverter", null))
        .isEqualTo("MAY-GIAT-LG-INVERTER");
  }

  @Test
  void normalizePart_pureVietnameseDoesNotBecomeEmpty() {
    assertThat(SkuNormalizer.normalizePart("Cái áo", null)).isEqualTo("CAI-AO");
    assertThat(SkuNormalizer.normalizePart("Quần jean nữ", null)).isEqualTo("QUAN-JEAN-NU");
  }

  @Test
  void normalizePart_blankPreferredUsesFallback() {
    assertThat(SkuNormalizer.normalizePart("  ", "sub-phone")).isEqualTo("SUB-PHONE");
    assertThat(SkuNormalizer.normalizePart(null, "GOOD")).isEqualTo("GOOD");
  }

  @Test
  void normalizePart_allInvalidReturnsNa() {
    assertThat(SkuNormalizer.normalizePart("---", null)).isEqualTo("NA");
    assertThat(SkuNormalizer.normalizePart(null, null)).isEqualTo("NA");
  }

  @Test
  void toAscii_stripsCombiningMarks() {
    assertThat(SkuNormalizer.toAscii("Hòa bình")).isEqualTo("Hoa binh");
    assertThat(SkuNormalizer.toAscii("đường")).isEqualTo("duong");
  }
}
