package com.naodab.uploadservice.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Configuration
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CloudinaryConfig {
  @Value("${cloudinary.id}")
  String id;

  @Value("${cloudinary.key}")
  String key;

  @Value("${cloudinary.secret}")
  String secret;

  @Bean
  public Cloudinary cloudinary() {
    Map<String, String> config = new HashMap<>();
    config.put("cloud_name", id);
    config.put("api_key", key);
    config.put("api_secret", secret);

    return new Cloudinary(config);
  }
}
