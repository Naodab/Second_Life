package com.naodab.productservice.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SkuNormalizer {

  private static final int MAX_PART_LENGTH = 48;

  private SkuNormalizer() {
  }

  public static String normalizePart(String preferred, String fallback) {
    String source = hasText(preferred) ? preferred : fallback;
    if (!hasText(source)) {
      return "NA";
    }

    String ascii = toAscii(source.trim());
    String normalized = ascii.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "-");
    normalized = trimHyphens(normalized);

    if (normalized.isBlank()) {
      return "NA";
    }
    if (normalized.length() > MAX_PART_LENGTH) {
      normalized = trimHyphens(normalized.substring(0, MAX_PART_LENGTH));
    }
    return normalized.isBlank() ? "NA" : normalized;
  }

  static String toAscii(String input) {
    String replaced = input.replace('đ', 'd').replace('Đ', 'D');
    return Normalizer.normalize(replaced, Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "");
  }

  private static String trimHyphens(String value) {
    int start = 0;
    int end = value.length();
    while (start < end && value.charAt(start) == '-') {
      start++;
    }
    while (end > start && value.charAt(end - 1) == '-') {
      end--;
    }
    return value.substring(start, end);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
