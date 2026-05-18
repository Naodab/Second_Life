package com.naodab.productservice.client;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.client.dto.InventoryPurgeStatsDto;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryAdminClient {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.inventory-service.url:}")
  String inventoryServiceUrl;

  public Optional<InventoryPurgeStatsDto> purgeAllListingLinkedInventoryIfConfigured(String adminRoleHeaderValue) {
    if (!StringUtils.hasText(inventoryServiceUrl)) {
      return Optional.empty();
    }
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri =
        UriComponentsBuilder.fromUriString(base + "/admin/inventory/purge-all").toUriString();
    HttpHeaders headers = new HttpHeaders();
    if (StringUtils.hasText(adminRoleHeaderValue)) {
      headers.set(AppConstants.JWT_CLAIM_ROLE, adminRoleHeaderValue.trim());
    }
    HttpEntity<Void> entity = new HttpEntity<>(headers);
    try {
      ResponseEntity<ApiResponse<InventoryPurgeStatsDto>> response =
          restTemplate.exchange(
              uri,
              HttpMethod.POST,
              entity,
              new ParameterizedTypeReference<ApiResponse<InventoryPurgeStatsDto>>() {});
      ApiResponse<InventoryPurgeStatsDto> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      return Optional.of(body.getData());
    } catch (RestClientException e) {
      log.error("Inventory purge-all call failed: {}", e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  public boolean isConfigured() {
    return StringUtils.hasText(inventoryServiceUrl);
  }

  private static String stripTrailingSlashes(String url) {
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }
}
