package com.naodab.authservice.clients;

import java.util.Optional;

import org.springframework.web.client.RestTemplate;

import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.response.ApiResponse;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;

import lombok.experimental.NonFinal;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileClient {

  @NonFinal
  @Value("${profile-service.url}")
  String profileServiceUrl;

  RestTemplate restTemplate;

  public Optional<ProfileResponse> getProfileById(String id) {
    if (!StringUtils.hasText(id)) {
      return Optional.empty();
    }
    try {
      String url = profileServiceUrl + "/profiles/{id}";
      ResponseEntity<ApiResponse<ProfileResponse>> response = restTemplate.exchange(url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<ProfileResponse>>() {
          },
          id);

      if (response.getStatusCode() != HttpStatus.OK) {
        return Optional.empty();
      }

      return Optional.ofNullable(response.getBody().getData());
    } catch (Exception e) {
      log.error("Failed to get profile by id: {}", id, e);
      return Optional.empty();
    }
  }

  public Optional<ProfileResponse> getProfileByEmail(String email) {
    if (!StringUtils.hasText(email)) {
      return Optional.empty();
    }
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.set(AppConstants.HEADER_USER_EMAIL, email.trim());
      HttpEntity<Void> entity = new HttpEntity<>(headers);
      String url = profileServiceUrl + "/profiles/me";
      ResponseEntity<ApiResponse<ProfileResponse>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          entity,
          new ParameterizedTypeReference<ApiResponse<ProfileResponse>>() {
          });
      if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
        return Optional.empty();
      }
      return Optional.ofNullable(response.getBody().getData());
    } catch (HttpStatusCodeException ex) {
      if (ex.getStatusCode() == HttpStatus.NOT_FOUND || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
        return Optional.empty();
      }
      log.error("Failed to get profile by email: {}", email, ex);
      return Optional.empty();
    } catch (Exception e) {
      log.error("Failed to get profile by email: {}", email, e);
      return Optional.empty();
    }
  }

  public Optional<ProfileResponse> createProfile(String email, String firstName, String lastName) {
    if (!StringUtils.hasText(email)) {
      return Optional.empty();
    }
    try {
      String url = profileServiceUrl + "/profiles";
      Map<String, String> body = Map.of(
          "email", email.trim(),
          "firstName", StringUtils.hasText(firstName) ? firstName.trim() : "Admin",
          "lastName", StringUtils.hasText(lastName) ? lastName.trim() : "Admin");
      ResponseEntity<ApiResponse<ProfileResponse>> response = restTemplate.exchange(
          url,
          HttpMethod.POST,
          new HttpEntity<>(body),
          new ParameterizedTypeReference<ApiResponse<ProfileResponse>>() {
          });
      if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
        return Optional.empty();
      }
      return Optional.ofNullable(response.getBody().getData());
    } catch (HttpStatusCodeException ex) {
      log.warn("Create profile failed for {}: {}", email, ex.getStatusCode());
      return Optional.empty();
    } catch (Exception e) {
      log.error("Failed to create profile for {}", email, e);
      return Optional.empty();
    }
  }

  /**
   * Ensures a profile row exists for the email and returns its id (service-to-service).
   */
  public Optional<String> ensureProfileIdForEmail(String email, String firstName, String lastName) {
    if (!StringUtils.hasText(email)) {
      return Optional.empty();
    }
    Optional<ProfileResponse> existing = getProfileByEmail(email);
    if (existing.isPresent() && StringUtils.hasText(existing.get().getId())) {
      return Optional.of(existing.get().getId().trim());
    }

    Optional<ProfileResponse> created = createProfile(email, firstName, lastName);
    if (created.isPresent() && StringUtils.hasText(created.get().getId())) {
      return Optional.of(created.get().getId().trim());
    }

    return getProfileByEmail(email)
        .map(ProfileResponse::getId)
        .filter(StringUtils::hasText)
        .map(String::trim);
  }
}
