package com.naodab.mailservice.clients;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.commonservice.util.PublicUrlHelper;
import com.naodab.mailservice.dto.FacilitySummary;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductClients {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.product-service.url}")
  String productServiceUrl;

  public FacilitySummary getFacility(String profileId, String facilityId) {
    if (!StringUtils.hasText(facilityId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    String base = PublicUrlHelper.stripTrailingSlash(productServiceUrl);
    String uri = base + "/facilities/" + facilityId.trim();
    HttpHeaders headers = new HttpHeaders();
    if (StringUtils.hasText(profileId)) {
      headers.set(AppConstants.HEADER_PROFILE_ID, profileId.trim());
    }
    try {
      ResponseEntity<ApiResponse<FacilitySummary>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          new HttpEntity<>(headers),
          new ParameterizedTypeReference<ApiResponse<FacilitySummary>>() {});
      ApiResponse<FacilitySummary> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      return body.getData();
    } catch (HttpClientErrorException.NotFound ex) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    } catch (RestClientException ex) {
      log.error("Product service call failed ({}): {}", uri, ex.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
