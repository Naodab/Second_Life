package com.naodab.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI authServiceOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Auth Service API")
            .description("Second Life — đăng ký, đăng nhập, OAuth2, JWT.")
            .version("1.0"))
        .components(new Components()
            .addSecuritySchemes("bearer-jwt",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT từ response đăng nhập (Authorization: Bearer ...)")));
  }
}
