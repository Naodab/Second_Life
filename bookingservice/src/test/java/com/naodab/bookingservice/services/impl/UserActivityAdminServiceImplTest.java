package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.response.UserOrderActivityCountsResponse;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class UserActivityAdminServiceImplTest {

  @Mock
  BookingOrderRepository bookingOrderRepository;

  @Mock
  RentalOrderRepository rentalOrderRepository;

  @Mock
  ProductClients productClients;

  @InjectMocks
  UserActivityAdminServiceImpl userActivityAdminService;

  @Test
  void getOrderActivityCounts_aggregatesBuyerAndSellerCounts() {
    when(productClients.listListingVariantIdsForOwnerAdmin("profile-1"))
        .thenReturn(List.of("variant-1", "variant-2"));
    when(bookingOrderRepository.countActiveByListingVariantIdIn(List.of("variant-1", "variant-2")))
        .thenReturn(4L);
    when(rentalOrderRepository.countActiveByListingVariantIdIn(List.of("variant-1", "variant-2")))
        .thenReturn(2L);
    when(bookingOrderRepository.countActiveByBuyerProfileId("profile-1")).thenReturn(7L);
    when(rentalOrderRepository.countActiveByBuyerProfileId("profile-1")).thenReturn(3L);

    UserOrderActivityCountsResponse counts = userActivityAdminService.getOrderActivityCounts(" profile-1 ");

    assertThat(counts.getBuyOrdersAsBuyer()).isEqualTo(7);
    assertThat(counts.getRentOrdersAsBuyer()).isEqualTo(3);
    assertThat(counts.getBuyOrdersReceived()).isEqualTo(4);
    assertThat(counts.getRentOrdersReceived()).isEqualTo(2);
  }

  @Test
  void getOrderActivityCounts_withoutSellerVariants_skipsReceivedCounts() {
    when(productClients.listListingVariantIdsForOwnerAdmin("profile-1")).thenReturn(List.of());
    when(bookingOrderRepository.countActiveByBuyerProfileId("profile-1")).thenReturn(1L);
    when(rentalOrderRepository.countActiveByBuyerProfileId("profile-1")).thenReturn(0L);

    UserOrderActivityCountsResponse counts = userActivityAdminService.getOrderActivityCounts("profile-1");

    assertThat(counts.getBuyOrdersReceived()).isZero();
    assertThat(counts.getRentOrdersReceived()).isZero();
    assertThat(counts.getBuyOrdersAsBuyer()).isEqualTo(1);
  }

  @Test
  void getOrderActivityCounts_blankProfileId_throws() {
    assertThatThrownBy(() -> userActivityAdminService.getOrderActivityCounts(" "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }
}
