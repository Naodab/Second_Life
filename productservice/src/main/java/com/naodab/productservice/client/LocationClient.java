package com.naodab.productservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.naodab.commonservice.response.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationClient {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.location-service.url}")
  String locationServiceUrl;

  public Boolean validLocation(String provinceCode, String wardCode, Float latitude, Float longitude) {
    try {
      String url = locationServiceUrl
          + "/provinces/{provinceCode}/wards/{wardCode}/valid-location?latitude={latitude}&longitude={longitude}";
      ResponseEntity<ApiResponse<Boolean>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<Boolean>>() {
          },
          provinceCode,
          wardCode,
          latitude,
          longitude);

      ApiResponse<Boolean> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null) {
        return false;
      }

      log.info("Valid location: {}", body.getData());
      return Boolean.TRUE.equals(body.getData());
    } catch (Exception e) {
      log.error("Failed to valid location: {}", e.getMessage());
      return false;
    }
  }

}
