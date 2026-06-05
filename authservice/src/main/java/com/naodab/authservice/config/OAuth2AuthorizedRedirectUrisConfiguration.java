package com.naodab.authservice.config;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import com.naodab.authservice.properties.OAuth2Properties;
import com.naodab.commonservice.util.PublicUrlHelper;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class OAuth2AuthorizedRedirectUrisConfiguration {

  private static final String GOOGLE_CALLBACK_SUFFIX = "/oauth2/callback/google";

  private final OAuth2Properties oAuth2Properties;

  @Value("${external.frontend_url:}")
  String frontendUrl;

  @Value("${external.cors_allowed_origins:}")
  String corsAllowedOrigins;

  @Value("${APP_OAUTH2_AUTHORIZED_REDIRECT_URIS:}")
  String extraRedirectUris;

  @PostConstruct
  void expandAuthorizedRedirectUris() {
    Set<String> merged = new LinkedHashSet<>();
    if (oAuth2Properties.getAuthorizedRedirectUris() != null) {
      oAuth2Properties.getAuthorizedRedirectUris().stream()
          .filter(StringUtils::hasText)
          .map(String::trim)
          .forEach(merged::add);
    }
    addCommaSeparated(merged, extraRedirectUris);
    addCallbackForOrigin(merged, frontendUrl);
    if (StringUtils.hasText(corsAllowedOrigins)) {
      for (String origin : corsAllowedOrigins.split(",")) {
        addCallbackForOrigin(merged, origin.trim());
      }
    }
    oAuth2Properties.setAuthorizedRedirectUris(new ArrayList<>(merged));
  }

  private static void addCommaSeparated(Set<String> target, String raw) {
    if (!StringUtils.hasText(raw)) {
      return;
    }
    for (String part : raw.split(",")) {
      if (StringUtils.hasText(part)) {
        target.add(part.trim());
      }
    }
  }

  private static void addCallbackForOrigin(Set<String> target, String origin) {
    if (!StringUtils.hasText(origin)) {
      return;
    }
    String base = PublicUrlHelper.stripTrailingSlash(origin);
    target.add(base + GOOGLE_CALLBACK_SUFFIX);
    addWwwApexPair(target, base);
  }

  private static void addWwwApexPair(Set<String> target, String base) {
    try {
      URI uri = URI.create(base);
      String host = uri.getHost();
      if (host == null || host.startsWith("localhost") || host.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
        return;
      }
      String scheme = uri.getScheme();
      int port = uri.getPort();
      String portSuffix = port > 0 ? ":" + port : "";
      if (host.startsWith("www.")) {
        String apexHost = host.substring(4);
        target.add(scheme + "://" + apexHost + portSuffix + GOOGLE_CALLBACK_SUFFIX);
      } else {
        target.add(scheme + "://www." + host + portSuffix + GOOGLE_CALLBACK_SUFFIX);
      }
    } catch (IllegalArgumentException ignored) {
      // skip invalid origin
    }
  }
}
