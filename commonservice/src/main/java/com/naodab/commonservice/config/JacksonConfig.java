package com.naodab.commonservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class JacksonConfig {

  /**
   * Shared HTTP JSON mapper for services that component-scan commonservice.
   * Without disabling {@link SerializationFeature#WRITE_DATES_AS_TIMESTAMPS},
   * {@code LocalDateTime} becomes a numeric JSON array instead of ISO-8601 strings.
   */
  @Bean
  ObjectMapper objectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper;
  }
}
