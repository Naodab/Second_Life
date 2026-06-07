package com.naodab.mailservice.clients;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.util.PublicUrlHelper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthClients {

  private static final String HEADER_FORWARDED_METHOD = "X-Forwarded-Method";
  private static final String HEADER_FORWARDED_URI = "X-Forwarded-Uri";

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.auth-service.url}")
  String authServiceUrl;

  public Optional<String> resolveProfileId(String accessToken) {
    return resolveAuthContext(accessToken).map(AuthForwardContext::profileId);
  }

  public Optional<AuthForwardContext> resolveAuthContext(String accessToken) {
    if (!StringUtils.hasText(accessToken)) {
      return Optional.empty();
    }
    String base = PublicUrlHelper.stripTrailingSlash(authServiceUrl);
    String uri = base + "/auth/forward-auth";
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken.trim());
    headers.set(HEADER_FORWARDED_METHOD, "GET");
    headers.set(HEADER_FORWARDED_URI, "/api/v1/ws/notifications");
    try {
      ResponseEntity<Void> response = restTemplate.exchange(
          uri, HttpMethod.GET, new HttpEntity<>(headers), Void.class);
      String profileId = response.getHeaders().getFirst(AppConstants.HEADER_PROFILE_ID);
      if (!StringUtils.hasText(profileId)) {
        return Optional.empty();
      }
      String role = response.getHeaders().getFirst(AppConstants.JWT_CLAIM_ROLE);
      return Optional.of(new AuthForwardContext(
          profileId.trim(),
          StringUtils.hasText(role) ? role.trim() : null));
    } catch (RestClientException ex) {
      log.warn("Auth forward-auth failed for websocket handshake: {}", ex.getMessage());
      return Optional.empty();
    }
  }
}
