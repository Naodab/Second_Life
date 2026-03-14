package com.naodab.authservice.properties;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.oauth2")
public class OAuth2Properties {
  private List<String> authorizedRedirectUris;
}
