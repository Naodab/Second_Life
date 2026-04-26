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
public class DataInitializer {
  CategorySeedBootstrap categorySeedBootstrap;
  AttributeSeedBootstrap attributeSeedBootstrap;

  @Bean
  public CommandLineRunner initializeData() {
    return args -> {
      try {
        categorySeedBootstrap.seedIfEmpty();
        attributeSeedBootstrap.seedIfEmpty();
      } catch (RuntimeException e) {
        log.error("Error initializing data", e);
      }
    };
  }
}
