package com.naodab.authservice.clients;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.naodab.authservice.clients.UserActivityClient.OrderCounts;
import com.naodab.authservice.clients.UserActivityClient.SellerCounts;
import com.naodab.authservice.dto.response.AdminAccountActivitySummaryResponse;
import com.naodab.commonservice.response.ApiResponse;

@ExtendWith(MockitoExtension.class)
class UserActivityClientTest {

  @Mock
  RestTemplate restTemplate;

  @InjectMocks
  UserActivityClient userActivityClient;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(userActivityClient, "productServiceUrl", "http://product-service:8086/api/v1");
    ReflectionTestUtils.setField(userActivityClient, "bookingServiceUrl", "http://booking-service:8088/api/v1");
  }

  @Test
  void getActivitySummary_returnsEmptyWhenProfileIdBlank() {
    AdminAccountActivitySummaryResponse summary = userActivityClient.getActivitySummary("  ");

    assertThat(summary.getSeller().getFacilities()).isZero();
    assertThat(summary.getSeller().getProducts()).isZero();
    assertThat(summary.getSeller().getListings()).isZero();
    assertThat(summary.getBuyer().getBuyOrders()).isZero();
    assertThat(summary.getBuyer().getRentOrders()).isZero();
    verifyNoInteractions(restTemplate);
  }

  @Test
  void getActivitySummary_aggregatesSellerAndBuyerCounts() {
    when(restTemplate.exchange(
        eq("http://product-service:8086/api/v1/admin/users/profile-1/seller-counts"),
        eq(HttpMethod.GET),
        any(HttpEntity.class),
        any(ParameterizedTypeReference.class)))
        .thenReturn(ResponseEntity.ok(ApiResponse.<SellerCounts>builder()
            .data(SellerCounts.builder().facilities(2).products(5).listings(3).build())
            .build()));

    when(restTemplate.exchange(
        eq("http://booking-service:8088/api/v1/admin/users/profile-1/order-counts"),
        eq(HttpMethod.GET),
        any(HttpEntity.class),
        any(ParameterizedTypeReference.class)))
        .thenReturn(ResponseEntity.ok(ApiResponse.<OrderCounts>builder()
            .data(OrderCounts.builder()
                .buyOrdersAsBuyer(4)
                .rentOrdersAsBuyer(1)
                .buyOrdersReceived(10)
                .rentOrdersReceived(6)
                .build())
            .build()));

    AdminAccountActivitySummaryResponse summary = userActivityClient.getActivitySummary(" profile-1 ");

    assertThat(summary.getSeller().getFacilities()).isEqualTo(2);
    assertThat(summary.getSeller().getProducts()).isEqualTo(5);
    assertThat(summary.getSeller().getListings()).isEqualTo(3);
    assertThat(summary.getSeller().getBuyOrdersReceived()).isEqualTo(10);
    assertThat(summary.getSeller().getRentOrdersReceived()).isEqualTo(6);
    assertThat(summary.getBuyer().getBuyOrders()).isEqualTo(4);
    assertThat(summary.getBuyer().getRentOrders()).isEqualTo(1);
  }

  @Test
  void getActivitySummary_returnsZeroWhenRemoteCallsFail() {
    when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
        .thenThrow(new RestClientException("down"));

    AdminAccountActivitySummaryResponse summary = userActivityClient.getActivitySummary("profile-1");

    assertThat(summary.getSeller().getFacilities()).isZero();
    assertThat(summary.getBuyer().getBuyOrders()).isZero();
  }

  @Test
  void getActivitySummary_returnsZeroWhenServiceUrlsMissing() {
    ReflectionTestUtils.setField(userActivityClient, "productServiceUrl", "");
    ReflectionTestUtils.setField(userActivityClient, "bookingServiceUrl", "");

    AdminAccountActivitySummaryResponse summary = userActivityClient.getActivitySummary("profile-1");

    assertThat(summary.getSeller().getProducts()).isZero();
    assertThat(summary.getBuyer().getRentOrders()).isZero();
    verifyNoInteractions(restTemplate);
  }

  @Test
  void getActivitySummary_returnsZeroWhenRemoteReturnsNonOk() {
    when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
        .thenReturn(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));

    AdminAccountActivitySummaryResponse summary = userActivityClient.getActivitySummary("profile-1");

    assertThat(summary.getSeller().getListings()).isZero();
    assertThat(summary.getBuyer().getBuyOrders()).isZero();
  }
}
