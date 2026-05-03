package com.naodab.productservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.client.dto.WardResolveDto;

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

  public Optional<ResolvedAdministrativeCodes> resolveProvinceWardFromLonLat(Float lon, Float lat) {
    if (lon == null || lat == null) {
      return Optional.empty();
    }
    try {
      String base = locationServiceUrl == null ? "" : locationServiceUrl.replaceAll("/+$", "");
      String uri = UriComponentsBuilder.fromUriString(base + "/wards/lon-lat")
          .queryParam("lon", lon)
          .queryParam("lat", lat)
          .toUriString();
      ResponseEntity<ApiResponse<List<WardResolveDto>>> response = restTemplate.exchange(
          uri,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<List<WardResolveDto>>>() {
          });
      ApiResponse<List<WardResolveDto>> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null) {
        return Optional.empty();
      }
      List<WardResolveDto> list = body.getData() != null ? body.getData() : Collections.emptyList();
      if (list.isEmpty()) {
        return Optional.empty();
      }
      WardResolveDto first = list.get(0);
      if (first == null || !StringUtils.hasText(first.getCode())) {
        return Optional.empty();
      }
      String wardCode = first.getCode().trim();
      String provinceCode = null;
      if (first.getProvince() != null && StringUtils.hasText(first.getProvince().getCode())) {
        provinceCode = first.getProvince().getCode().trim();
      }
      if (!StringUtils.hasText(provinceCode)) {
        return Optional.empty();
      }
      return Optional.of(new ResolvedAdministrativeCodes(provinceCode, wardCode));
    } catch (Exception e) {
      log.warn("Failed to resolve province/ward from lon={}, lat={}: {}", lon, lat, e.getMessage());
      return Optional.empty();
    }
  }

  public record ResolvedAdministrativeCodes(String provinceCode, String wardCode) {
  }

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
