package com.naodab.authservice.clients;

import java.util.Optional;

import org.springframework.web.client.RestTemplate;

import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.commonservice.response.ApiResponse;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

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
}
