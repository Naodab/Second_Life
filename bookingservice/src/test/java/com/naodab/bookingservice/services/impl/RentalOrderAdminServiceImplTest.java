package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.bookingservice.clients.LocationClients;
import com.naodab.bookingservice.clients.LocationClients.LocationLabels;
import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.mappers.RentalOrderMapper;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.RentalOrder;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.commonservice.response.PagedItemsResponse;

@ExtendWith(MockitoExtension.class)
class RentalOrderAdminServiceImplTest {

  @Mock
  RentalOrderRepository rentalOrderRepository;

  @Mock
  ProductClients productClients;

  @InjectMocks
  RentalOrderAdminServiceImpl rentalOrderAdminService;

  RentalOrderMapper rentalOrderMapper;

  @Mock
  LocationClients locationClients;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(rentalOrderAdminService, "defaultPageSize", 20);
    lenient()
        .when(locationClients.resolveLabels(any(), any()))
        .thenReturn(new LocationLabels("Hà Nội", "Ba Đình"));
    rentalOrderMapper = new RentalOrderMapper(new CustomerMapper(locationClients));
    ReflectionTestUtils.setField(rentalOrderAdminService, "rentalOrderMapper", rentalOrderMapper);
  }

  @Test
  void listOrders_returnsPagedResponses() {
    Customer customer = customer("profile-1");
    RentalOrder order = rentalOrder("rent-1", customer);
    when(rentalOrderRepository.findAdminPage(isNull(), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(order), org.springframework.data.domain.PageRequest.of(0, 20), 1));

    PagedItemsResponse<?> result = rentalOrderAdminService.listOrders(0, 20, null, null, null);

    assertThat(result.getTotalCount()).isEqualTo(1);
    assertThat(result.getItems()).hasSize(1);
  }

  @Test
  void listOrders_byBuyerProfileId_usesBuyerRepositoryQuery() {
    Customer customer = customer("profile-buyer");
    RentalOrder order = rentalOrder("rent-buyer", customer);
    when(rentalOrderRepository.findAdminPageByBuyerProfileId(isNull(), eq("profile-buyer"), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(order), org.springframework.data.domain.PageRequest.of(0, 20), 1));

    PagedItemsResponse<?> result = rentalOrderAdminService.listOrders(0, 20, null, "profile-buyer", null);

    assertThat(result.getTotalCount()).isEqualTo(1);
    verify(rentalOrderRepository).findAdminPageByBuyerProfileId(isNull(), eq("profile-buyer"), any(Pageable.class));
  }

  @Test
  void listOrders_bySellerProfileIdWithoutVariants_returnsEmptyPage() {
    when(productClients.listListingVariantIdsForOwnerAdmin("profile-seller")).thenReturn(List.of());

    PagedItemsResponse<?> result = rentalOrderAdminService.listOrders(0, 20, null, null, "profile-seller");

    assertThat(result.getTotalCount()).isZero();
    verify(rentalOrderRepository, never()).findAdminPageByListingVariantIdIn(any(), any(), any());
  }

  private static Customer customer(String profileId) {
    return Customer.builder()
        .id("customer-1")
        .profileId(profileId)
        .firstName("An")
        .lastName("Bùi")
        .email("an@example.com")
        .build();
  }

  private static RentalOrder rentalOrder(String id, Customer customer) {
    RentalOrder order = RentalOrder.builder()
        .id(id)
        .customer(customer)
        .listingVariantId("variant-1")
        .quantity(1)
        .startTime(LocalDateTime.parse("2026-06-10T10:00:00"))
        .endTime(LocalDateTime.parse("2026-06-12T10:00:00"))
        .status(RentalOrderStatus.PENDING)
        .price(200_000L)
        .build();
    order.setCreatedAt(LocalDateTime.parse("2026-06-10T09:00:00"));
    return order;
  }
}
