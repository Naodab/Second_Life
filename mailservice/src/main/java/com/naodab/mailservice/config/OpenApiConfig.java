package com.naodab.mailservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI mailServiceOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Mail Service API")
            .description("Second Life — gửi email (chủ yếu Kafka consumer; có endpoint test nội bộ).")
            .version("1.0"));
  }
}
