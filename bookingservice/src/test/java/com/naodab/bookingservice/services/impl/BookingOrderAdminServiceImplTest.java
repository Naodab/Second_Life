package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
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
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.commonservice.response.PagedItemsResponse;

@ExtendWith(MockitoExtension.class)
class BookingOrderAdminServiceImplTest {

  @Mock
  BookingOrderRepository bookingOrderRepository;

  @InjectMocks
  BookingOrderAdminServiceImpl bookingOrderAdminService;

  BookingOrderMapper bookingOrderMapper;

  @org.mockito.Mock
  LocationClients locationClients;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(bookingOrderAdminService, "defaultPageSize", 20);
    lenient()
        .when(locationClients.resolveLabels(any(), any()))
        .thenReturn(new LocationLabels("Hà Nội", "Ba Đình"));
    bookingOrderMapper = new BookingOrderMapper(new CustomerMapper(locationClients));
    ReflectionTestUtils.setField(bookingOrderAdminService, "bookingOrderMapper", bookingOrderMapper);
  }

  @Test
  void listOrders_returnsPagedResponses() {
    Customer customer = Customer.builder()
        .id("customer-1")
        .profileId("profile-1")
        .firstName("An")
        .lastName("Bùi")
        .email("an@example.com")
        .build();
    BookingOrder order = BookingOrder.builder()
        .id("order-1")
        .customer(customer)
        .listingVariantId("variant-1")
        .quantity(1)
        .pickupTime(LocalDateTime.parse("2026-06-10T10:00:00"))
        .status(BookingOrderStatus.PENDING)
        .price(100_000L)
        .build();
    order.setCreatedAt(LocalDateTime.parse("2026-06-10T09:00:00"));

    when(bookingOrderRepository.findAdminPage(isNull(), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(order), org.springframework.data.domain.PageRequest.of(0, 20), 1));

    PagedItemsResponse<?> result = bookingOrderAdminService.listOrders(0, 20, null);

    assertThat(result.getTotalCount()).isEqualTo(1);
    assertThat(result.getItems()).hasSize(1);
    assertThat(result.getItems().getFirst()).isInstanceOf(com.naodab.bookingservice.dto.response.BookingOrderResponse.class);
  }
}
