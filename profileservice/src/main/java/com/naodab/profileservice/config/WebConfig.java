package com.naodab.profileservice.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.naodab.commonservice.constant.AppConstants;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${external.cors_allowed_origins:http://localhost:5173,http://localhost:8080}")
  private String corsAllowedOrigins;

  @Override
  public void addCorsMappings(@NonNull CorsRegistry registry) {
    List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();
    registry.addMapping("/**")
        .allowedOrigins(origins.toArray(new String[0]))
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
        .allowedHeaders(
            "Authorization",
            "Content-Type",
            AppConstants.HEADER_PROFILE_ID,
            AppConstants.HEADER_USER_EMAIL);
  }
}
