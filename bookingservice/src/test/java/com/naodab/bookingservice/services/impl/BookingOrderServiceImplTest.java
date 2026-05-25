package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.naodab.bookingservice.clients.InventoryClients;
import com.naodab.bookingservice.clients.LocationClients;
import com.naodab.bookingservice.clients.LocationClients.LocationLabels;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class BookingOrderServiceImplTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String CUSTOMER_ID = "customer-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final LocalDateTime PICKUP = LocalDateTime.of(2026, 6, 1, 10, 0, 0);

  @Mock
  BookingOrderRepository bookingOrderRepository;

  @Mock
  CustomerService customerService;

  @Mock
  InventoryClients inventoryClients;

  @Mock
  LocationClients locationClients;

  BookingOrderMapper bookingOrderMapper;
  BookingOrderServiceImpl bookingOrderService;

  @BeforeEach
  void setUp() {
    when(locationClients.resolveLabels(anyString(), anyString()))
        .thenReturn(new LocationLabels("Ho Chi Minh", "Ben Nghe"));
    bookingOrderMapper = new BookingOrderMapper(new CustomerMapper(locationClients));
    bookingOrderService = new BookingOrderServiceImpl(
        bookingOrderMapper,
        bookingOrderRepository,
        customerService,
        inventoryClients);
  }

  @Test
  void createBookingOrder_sufficientStock_reservesThenSavesOrder() {
    BookingOrderCreateRequest request = sampleRequest(2);
    Customer customer = sampleCustomer();
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(customer);
    when(inventoryClients.getBuyInventoryCount(LISTING_VARIANT_ID)).thenReturn(5L);
    when(bookingOrderRepository.save(any(BookingOrder.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderResponse response = bookingOrderService.createBookingOrder(PROFILE_ID, request);

    assertThat(response.getId()).isNotBlank();
    assertThat(response.getListingVariantId()).isEqualTo(LISTING_VARIANT_ID);
    assertThat(response.getCustomer()).isNotNull();
    assertThat(response.getCustomerId()).isEqualTo(CUSTOMER_ID);

    ArgumentCaptor<InventoryReservationCreateEvent> eventCaptor = ArgumentCaptor
        .forClass(InventoryReservationCreateEvent.class);
    InOrder inOrder = inOrder(inventoryClients, bookingOrderRepository);
    inOrder.verify(inventoryClients).createBuyReservation(eventCaptor.capture());
    inOrder.verify(bookingOrderRepository).save(any(BookingOrder.class));
    verify(inventoryClients, never()).releaseBuyReservation(any());
    verify(customerService, never()).createCustomer(any(), any());

    InventoryReservationCreateEvent event = eventCaptor.getValue();
    assertThat(event.getCustomerId()).isEqualTo(PROFILE_ID);
    assertThat(event.getQuantity()).isEqualTo(2);
  }

  @Test
  void createBookingOrder_saveFails_releasesReservation() {
    BookingOrderCreateRequest request = sampleRequest(1);
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getBuyInventoryCount(LISTING_VARIANT_ID)).thenReturn(3L);
    when(bookingOrderRepository.save(any(BookingOrder.class)))
        .thenThrow(new DataIntegrityViolationException("duplicate"));

    assertThatThrownBy(() -> bookingOrderService.createBookingOrder(PROFILE_ID, request))
        .isInstanceOf(DataIntegrityViolationException.class);

    verify(inventoryClients).releaseBuyReservation(any());
  }

  @Test
  void createBookingOrder_insufficientStock_throwsBeforeReserveOrSave() {
    BookingOrderCreateRequest request = sampleRequest(3);
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getBuyInventoryCount(LISTING_VARIANT_ID)).thenReturn(2L);

    assertThatThrownBy(() -> bookingOrderService.createBookingOrder(PROFILE_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);

    verify(inventoryClients, never()).createBuyReservation(any());
    verify(bookingOrderRepository, never()).save(any());
  }

  private static Customer sampleCustomer() {
    return Customer.builder()
        .id(CUSTOMER_ID)
        .profileId(PROFILE_ID)
        .firstName("An")
        .lastName("Nguyen")
        .phoneNumber("0901234567")
        .email("an@example.com")
        .address("123 Duong ABC")
        .provinceCode("79")
        .wardCode("26734")
        .isDefault(true)
        .build();
  }

  private static BookingOrderCreateRequest sampleRequest(int quantity) {
    return BookingOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(quantity)
        .pickupTime(PICKUP)
        .customerId(CUSTOMER_ID)
        .build();
  }
}
