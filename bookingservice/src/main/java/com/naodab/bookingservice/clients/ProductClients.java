package com.naodab.bookingservice.clients;

import java.util.Collections;
import java.util.List;
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

import com.naodab.bookingservice.dto.response.ListingVariantContextResponse;
import com.naodab.commonservice.constant.AppConstants;
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
public class ProductClients {

  private static final String LOG_PRODUCT_CALL_FAILED = "Product service call failed ({}): {}";

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.product-service.url}")
  String productServiceUrl;

  public List<String> listListingVariantIdsForFacility(String profileId, String facilityId) {
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/facilities/" + facilityId.trim() + "/listing-variant-ids";
    return getStringList(profileId, uri);
  }

  public List<String> listListingVariantIdsForOwner(String profileId) {
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/facilities/me/listing-variant-ids";
    return getStringList(profileId, uri);
  }

  public List<String> listListingVariantIdsForOwnerAdmin(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      return List.of();
    }
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/admin/users/" + profileId.trim() + "/listing-variant-ids";
    HttpHeaders headers = new HttpHeaders();
    headers.set(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN);
    try {
      ResponseEntity<ApiResponse<List<String>>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          new HttpEntity<>(headers),
          new ParameterizedTypeReference<ApiResponse<List<String>>>() {});
      ApiResponse<List<String>> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        return List.of();
      }
      return body.getData();
    } catch (RestClientException e) {
      log.error(LOG_PRODUCT_CALL_FAILED, uri, e.getMessage());
      return List.of();
    }
  }

  public ListingVariantContextResponse getListingVariantContext(String listingVariantId) {
    if (!StringUtils.hasText(listingVariantId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/listings/variants/" + listingVariantId.trim() + "/context";
    try {
      ResponseEntity<ApiResponse<ListingVariantContextResponse>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<ListingVariantContextResponse>>() {});
      ApiResponse<ListingVariantContextResponse> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      return body.getData();
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    } catch (RestClientException e) {
      log.error(LOG_PRODUCT_CALL_FAILED, uri, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  public void recordFacilityOrder(String facilityId) {
    if (!StringUtils.hasText(facilityId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/facilities/" + facilityId.trim() + "/record-order";
    try {
      ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.POST),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<Void>>() {});
      if (response.getStatusCode() != HttpStatus.OK) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    } catch (RestClientException e) {
      log.error(LOG_PRODUCT_CALL_FAILED, uri, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  public String resolveOwnerProfileId(String listingVariantId) {
    if (listingVariantId == null || listingVariantId.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    String base = stripTrailingSlashes(productServiceUrl.trim());
    String uri = base + "/listing-variants/" + listingVariantId.trim() + "/owner-profile-id";
    try {
      ResponseEntity<ApiResponse<String>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<String>>() {});
      ApiResponse<String> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || !StringUtils.hasText(body.getData())) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      return body.getData().trim();
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    } catch (HttpClientErrorException e) {
      if (e.getStatusCode() == HttpStatus.FORBIDDEN || e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
        throw new AppException(ErrorCode.UNAUTHORIZED);
      }
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    } catch (RestClientException e) {
      log.error(LOG_PRODUCT_CALL_FAILED, uri, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private List<String> getStringList(String profileId, String uri) {
    HttpHeaders headers = new HttpHeaders();
    headers.set(AppConstants.HEADER_PROFILE_ID, profileId.trim());
    try {
      ResponseEntity<ApiResponse<List<String>>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          new HttpEntity<>(headers),
          new ParameterizedTypeReference<ApiResponse<List<String>>>() {});
      ApiResponse<List<String>> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      return body.getData();
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    } catch (HttpClientErrorException e) {
      if (e.getStatusCode() == HttpStatus.FORBIDDEN || e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
        throw new AppException(ErrorCode.UNAUTHORIZED);
      }
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    } catch (RestClientException e) {
      log.error(LOG_PRODUCT_CALL_FAILED, uri, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private static String stripTrailingSlashes(String url) {
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }

  public static List<String> emptyIfNull(List<String> ids) {
    return ids == null ? Collections.emptyList() : ids;
  }
}
