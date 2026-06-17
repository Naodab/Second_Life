package com.naodab.productservice.util;

import java.util.Locale;

import org.springframework.util.StringUtils;

public final class SearchKeywordNormalizer {

  private SearchKeywordNormalizer() {
  }

  public static String normalize(String keyword) {
    if (!StringUtils.hasText(keyword)) {
      return null;
    }
    String collapsed = keyword.trim().replaceAll("\\s+", " ");
    return collapsed.isEmpty() ? null : collapsed;
  }

  public static boolean isMultiToken(String normalizedKeyword) {
    return StringUtils.hasText(normalizedKeyword) && normalizedKeyword.contains(" ");
  }

  public static boolean looksLikeSkuToken(String token) {
    if (!StringUtils.hasText(token)) {
      return false;
    }
    String t = token.trim();
    return t.length() >= 2 && t.matches("(?i)[a-z0-9][a-z0-9._-]*");
  }

  public static String escapeWildcard(String value) {
    if (value == null || value.isEmpty()) {
      return "";
    }
    return value
        .replace("\\", "\\\\")
        .replace("*", "\\*")
        .replace("?", "\\?")
        .replace("[", "\\[")
        .replace("]", "\\]");
  }

  public static String wildcardContainsPattern(String normalizedKeyword) {
    String escaped = escapeWildcard(normalizedKeyword.trim().toUpperCase(Locale.ROOT));
    return "*" + escaped + "*";
  }
}
