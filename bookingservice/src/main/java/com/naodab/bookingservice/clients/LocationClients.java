package com.naodab.bookingservice.clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.bookingservice.clients.dto.LocationProvinceDto;
import com.naodab.bookingservice.clients.dto.LocationWardDto;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationClients {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.location-service.url}")
  String locationServiceUrl;

  public void assertProvinceWardValid(String provinceCode, String wardCode) {
    String province = trim(provinceCode);
    String ward = trim(wardCode);
    if (!StringUtils.hasText(province) || !StringUtils.hasText(ward)) {
      log.warn("assertProvinceWardValid missing codes province={} ward={}", provinceCode, wardCode);
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    log.debug("Validating province={} ward={} via location-service {}", province, ward, locationServiceUrl);
    LocationWardDto wardDto = fetchWard(ward);
    if (wardDto.getProvince() == null || !StringUtils.hasText(wardDto.getProvince().getCode())) {
      log.warn("Ward {} has no province in location-service response", ward);
      throw new AppException(ErrorCode.WARD_NOT_FOUND);
    }
    String wardProvinceCode = trim(wardDto.getProvince().getCode());
    if (!province.equalsIgnoreCase(wardProvinceCode)) {
      log.warn(
          "Province/ward mismatch: requested province={} but ward {} belongs to province={}",
          province,
          ward,
          wardProvinceCode);
      throw new AppException(ErrorCode.FACILITY_LOCATION_INVALID);
    }

    fetchProvince(province);
  }

  public LocationLabels resolveLabels(String provinceCode, String wardCode) {
    String province = trim(provinceCode);
    String ward = trim(wardCode);
    if (!StringUtils.hasText(province) || !StringUtils.hasText(ward)) {
      return LocationLabels.empty();
    }
    try {
      LocationProvinceDto provinceDto = fetchProvince(province);
      LocationWardDto wardDto = fetchWard(ward);
      String provinceLabel = label(provinceDto.getFullName(), provinceDto.getName(), province);
      String wardLabel = label(wardDto.getFullName(), wardDto.getName(), ward);
      return new LocationLabels(provinceLabel, wardLabel);
    } catch (AppException e) {
      log.warn("Could not resolve location labels for province={}, ward={}: {}", province, ward, e.getMessage());
      return LocationLabels.empty();
    } catch (RestClientException e) {
      log.warn("Location service unavailable while resolving labels for province={}, ward={}: {}",
          province, ward, e.getMessage());
      return LocationLabels.empty();
    }
  }

  private LocationProvinceDto fetchProvince(String provinceCode) {
    String uri = UriComponentsBuilder.fromUriString(stripTrailingSlashes(locationServiceUrl))
        .path("/provinces/{code}")
        .buildAndExpand(provinceCode)
        .encode()
        .toUriString();
    try {
      ResponseEntity<ApiResponse<LocationProvinceDto>> response = restTemplate.exchange(
          uri,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<LocationProvinceDto>>() {
          });
      LocationProvinceDto data = bodyData(response);
      if (data == null || !StringUtils.hasText(data.getCode())) {
        throw new AppException(ErrorCode.PROVINCE_NOT_FOUND);
      }
      return data;
    } catch (HttpStatusCodeException e) {
      throw mapHttpError("province", provinceCode, e, ErrorCode.PROVINCE_NOT_FOUND);
    } catch (RestClientException e) {
      throw mapClientError("province", provinceCode, e);
    }
  }

  private LocationWardDto fetchWard(String wardCode) {
    String uri = UriComponentsBuilder.fromUriString(stripTrailingSlashes(locationServiceUrl))
        .path("/wards/{code}")
        .buildAndExpand(wardCode)
        .encode()
        .toUriString();
    try {
      ResponseEntity<ApiResponse<LocationWardDto>> response = restTemplate.exchange(
          uri,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<LocationWardDto>>() {
          });
      LocationWardDto data = bodyData(response);
      if (data == null || !StringUtils.hasText(data.getCode())) {
        throw new AppException(ErrorCode.WARD_NOT_FOUND);
      }
      return data;
    } catch (HttpStatusCodeException e) {
      throw mapHttpError("ward", wardCode, e, ErrorCode.WARD_NOT_FOUND);
    } catch (RestClientException e) {
      throw mapClientError("ward", wardCode, e);
    }
  }

  private AppException mapHttpError(
      String kind, String code, HttpStatusCodeException e, ErrorCode notFoundCode) {
    if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
      log.warn("Location service: {} {} not found", kind, code);
      return new AppException(notFoundCode);
    }
    log.error(
        "Location service HTTP {} for {} {} (url base={}): {}",
        e.getStatusCode(),
        kind,
        code,
        locationServiceUrl,
        e.getResponseBodyAsString());
    return new AppException(ErrorCode.FACILITY_LOCATION_INVALID);
  }

  private AppException mapClientError(String kind, String code, RestClientException e) {
    log.error("Failed to call location service for {} {} (baseUrl={}): {}",
        kind, code, locationServiceUrl, e.getMessage());
    return new AppException(ErrorCode.FACILITY_LOCATION_INVALID);
  }

  private static <T> T bodyData(ResponseEntity<ApiResponse<T>> response) {
    if (response.getStatusCode() != HttpStatus.OK) {
      return null;
    }
    ApiResponse<T> body = response.getBody();
    if (body == null) {
      return null;
    }
    return body.getData();
  }

  private static String label(String fullName, String name, String fallback) {
    if (StringUtils.hasText(fullName)) {
      return fullName.trim();
    }
    if (StringUtils.hasText(name)) {
      return name.trim();
    }
    return fallback;
  }

  private static String trim(String value) {
    return value == null ? "" : value.trim();
  }

  private static String stripTrailingSlashes(String url) {
    if (url == null) {
      return "";
    }
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }

  public record LocationLabels(String provinceName, String wardName) {
    static LocationLabels empty() {
      return new LocationLabels(null, null);
    }
  }
}
