package com.naodab.locationservice.config;

/**
 * Names of Spring {@link org.springframework.cache.Cache} regions stored in
 * Redis.
 */
public final class CacheNames {

  private CacheNames() {
  }

  /**
   * Province reads: keys use prefixes {@code code:}, {@code list:},
   * {@code page:}, {@code all}.
   */
  public static final String PROVINCES = "provinces";

  /**
   * Ward reads: keys use prefixes {@code code:}, {@code page:}, {@code all}.
   */
  public static final String WARDS = "wards";
}
