package com.naodab.authservice.clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import com.naodab.authservice.dto.response.AdminAccountActivitySummaryResponse;
import com.naodab.authservice.dto.response.AdminAccountBuyerActivitySummary;
import com.naodab.authservice.dto.response.AdminAccountSellerActivitySummary;
import com.naodab.commonservice.constant.AppConstants;
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
public class UserActivityClient {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${product-service.url:}")
  String productServiceUrl;

  @NonFinal
  @Value("${booking-service.url:}")
  String bookingServiceUrl;

  public AdminAccountActivitySummaryResponse getActivitySummary(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      return emptySummary();
    }
    String normalizedProfileId = profileId.trim();
    SellerCounts sellerCounts = fetchSellerCounts(normalizedProfileId);
    OrderCounts orderCounts = fetchOrderCounts(normalizedProfileId);
    return AdminAccountActivitySummaryResponse.builder()
        .seller(AdminAccountSellerActivitySummary.builder()
            .facilities(sellerCounts.getFacilities())
            .products(sellerCounts.getProducts())
            .listings(sellerCounts.getListings())
            .buyOrdersReceived(orderCounts.getBuyOrdersReceived())
            .rentOrdersReceived(orderCounts.getRentOrdersReceived())
            .build())
        .buyer(AdminAccountBuyerActivitySummary.builder()
            .buyOrders(orderCounts.getBuyOrdersAsBuyer())
            .rentOrders(orderCounts.getRentOrdersAsBuyer())
            .build())
        .build();
  }

  private SellerCounts fetchSellerCounts(String profileId) {
    if (!StringUtils.hasText(productServiceUrl)) {
      return SellerCounts.empty();
    }
    String url = stripTrailingSlashes(productServiceUrl.trim())
        + "/admin/users/" + profileId + "/seller-counts";
    try {
      ResponseEntity<ApiResponse<SellerCounts>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          adminEntity(),
          new ParameterizedTypeReference<ApiResponse<SellerCounts>>() {});
      if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null || response.getBody().getData() == null) {
        return SellerCounts.empty();
      }
      return response.getBody().getData();
    } catch (Exception e) {
      log.error("Failed to fetch seller activity counts for profileId={}", profileId, e);
      return SellerCounts.empty();
    }
  }

  private OrderCounts fetchOrderCounts(String profileId) {
    if (!StringUtils.hasText(bookingServiceUrl)) {
      return OrderCounts.empty();
    }
    String url = stripTrailingSlashes(bookingServiceUrl.trim())
        + "/admin/users/" + profileId + "/order-counts";
    try {
      ResponseEntity<ApiResponse<OrderCounts>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          adminEntity(),
          new ParameterizedTypeReference<ApiResponse<OrderCounts>>() {});
      if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null || response.getBody().getData() == null) {
        return OrderCounts.empty();
      }
      return response.getBody().getData();
    } catch (Exception e) {
      log.error("Failed to fetch order activity counts for profileId={}", profileId, e);
      return OrderCounts.empty();
    }
  }

  private static HttpEntity<Void> adminEntity() {
    HttpHeaders headers = new HttpHeaders();
    headers.set(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN);
    return new HttpEntity<>(headers);
  }

  private static AdminAccountActivitySummaryResponse emptySummary() {
    return AdminAccountActivitySummaryResponse.builder()
        .seller(AdminAccountSellerActivitySummary.builder().build())
        .buyer(AdminAccountBuyerActivitySummary.builder().build())
        .build();
  }

  private static String stripTrailingSlashes(String url) {
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }

  @lombok.Getter
  @lombok.Setter
  @lombok.Builder
  @lombok.NoArgsConstructor
  @lombok.AllArgsConstructor
  static class SellerCounts {
    long facilities;
    long products;
    long listings;

    static SellerCounts empty() {
      return SellerCounts.builder().build();
    }
  }

  @lombok.Getter
  @lombok.Setter
  @lombok.Builder
  @lombok.NoArgsConstructor
  @lombok.AllArgsConstructor
  static class OrderCounts {
    long buyOrdersAsBuyer;
    long rentOrdersAsBuyer;
    long buyOrdersReceived;
    long rentOrdersReceived;

    static OrderCounts empty() {
      return OrderCounts.builder().build();
    }
  }
}
