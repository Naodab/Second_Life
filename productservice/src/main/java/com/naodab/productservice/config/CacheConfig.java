package com.naodab.productservice.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

import java.util.List;

@Configuration
public class CacheConfig {

  public static final String SUGGESTIONS_CACHE = "suggestions";
  public static final String AI_DB_CONTEXT_CACHE = "ai-db-context";

  @Bean
  public SimpleCacheManager cacheManager() {
    CaffeineCache suggestionsCache = new CaffeineCache(
        SUGGESTIONS_CACHE,
        Caffeine.newBuilder()
            .expireAfterWrite(3, TimeUnit.MINUTES)
            .maximumSize(500)
            .build());

    CaffeineCache aiDbContextCache = new CaffeineCache(
        AI_DB_CONTEXT_CACHE,
        Caffeine.newBuilder()
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .maximumSize(1)
            .build());

    SimpleCacheManager manager = new SimpleCacheManager();
    manager.setCaches(List.of(suggestionsCache, aiDbContextCache));
    return manager;
  }
}
