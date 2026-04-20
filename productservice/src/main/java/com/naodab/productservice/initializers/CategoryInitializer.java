package com.naodab.productservice.initializers;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategoryInitializer {
  CategorySeedBootstrap categorySeedBootstrap;

  @Bean
  public CommandLineRunner initializeCategories() {
    return args -> {
      try {
        categorySeedBootstrap.seedIfEmpty();
      } catch (RuntimeException e) {
        log.error("Error initializing categories", e);
      }
    };
  }
}
