package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.time.Month;

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
import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.request.BookingOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.dto.response.ListingVariantContextResponse;
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.bookingservice.services.OrderNotificationPublisher;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class BookingOrderServiceImplTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String CUSTOMER_ID = "customer-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final String ORDER_ID = "order-1";
  private static final LocalDateTime PICKUP = LocalDateTime.of(2026, Month.JUNE, 1, 10, 0, 0);

  @Mock
  BookingOrderRepository bookingOrderRepository;

  @Mock
  CustomerService customerService;

  @Mock
  InventoryClients inventoryClients;

  @Mock
  ProductClients productClients;

  @Mock
  OrderNotificationPublisher orderNotificationPublisher;

  @Mock
  LocationClients locationClients;

  BookingOrderMapper bookingOrderMapper;
  BookingOrderServiceImpl bookingOrderService;

  @BeforeEach
  void setUp() {
    lenient()
        .when(locationClients.resolveLabels(anyString(), anyString()))
        .thenReturn(new LocationLabels("Ho Chi Minh", "Ben Nghe"));
    bookingOrderMapper = new BookingOrderMapper(new CustomerMapper(locationClients));
    bookingOrderService = new BookingOrderServiceImpl(
        bookingOrderMapper,
        bookingOrderRepository,
        customerService,
        inventoryClients,
        productClients,
        orderNotificationPublisher);
  }

  @Test
  void createBookingOrder_sufficientStock_reservesThenSavesOrder() {
    BookingOrderCreateRequest request = sampleRequest(2);
    Customer customer = sampleCustomer();
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(customer);
    when(inventoryClients.getBuyInventoryCount(LISTING_VARIANT_ID)).thenReturn(5L);
    when(productClients.getListingVariantContext(LISTING_VARIANT_ID))
        .thenReturn(ListingVariantContextResponse.builder().facilityId("fac-1").build());
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
    verify(productClients).recordFacilityOrder("fac-1");
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
  void createBookingOrder_nullInventoryCount_throwsBeforeReserveOrSave() {
    BookingOrderCreateRequest request = sampleRequest(1);
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getBuyInventoryCount(LISTING_VARIANT_ID)).thenReturn(null);

    assertThatThrownBy(() -> bookingOrderService.createBookingOrder(PROFILE_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);

    verify(inventoryClients, never()).createBuyReservation(any());
    verify(bookingOrderRepository, never()).save(any());
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

  @Test
  void cancelBookingOrder_pending_cancelsAndReleasesInventory() {
    BookingOrder order = samplePendingOrder();
    when(bookingOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.of(order));
    when(bookingOrderRepository.save(order)).thenReturn(order);

    bookingOrderService.cancelBookingOrder(PROFILE_ID, ORDER_ID);

    assertThat(order.getStatus()).isEqualTo(BookingOrderStatus.CANCELLED);
    verify(bookingOrderRepository).save(order);
    verify(inventoryClients).releaseBuyReservation(ORDER_ID);
  }

  @Test
  void cancelBookingOrder_confirmed_throwsAndDoesNotRelease() {
    BookingOrder order = samplePendingOrder();
    order.setStatus(BookingOrderStatus.CONFIRMED);
    when(bookingOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.of(order));

    assertThatThrownBy(() -> bookingOrderService.cancelBookingOrder(PROFILE_ID, ORDER_ID))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_CANCEL_NOT_ALLOWED);

    verify(bookingOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void cancelBookingOrder_notFound_throws() {
    when(bookingOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookingOrderService.cancelBookingOrder(PROFILE_ID, ORDER_ID))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_NOT_FOUND);

    verify(bookingOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void listBookingOrders_returnsOrdersForProfile() {
    BookingOrder order = samplePendingOrder();
    when(bookingOrderRepository.findActiveByProfileId(PROFILE_ID)).thenReturn(List.of(order));

    List<BookingOrderResponse> responses = bookingOrderService.listBookingOrders(PROFILE_ID);

    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).getId()).isEqualTo(ORDER_ID);
    assertThat(responses.get(0).getCustomerId()).isEqualTo(CUSTOMER_ID);
    assertThat(responses.get(0).getListingVariantId()).isEqualTo(LISTING_VARIANT_ID);
    assertThat(responses.get(0).getStatus()).isEqualTo(BookingOrderStatus.PENDING);
    verify(bookingOrderRepository).findActiveByProfileId(PROFILE_ID);
  }

  @Test
  void listBookingOrders_returnsEmptyListWhenNoOrders() {
    when(bookingOrderRepository.findActiveByProfileId(PROFILE_ID)).thenReturn(List.of());

    List<BookingOrderResponse> responses = bookingOrderService.listBookingOrders(PROFILE_ID);

    assertThat(responses).isEmpty();
    verify(bookingOrderRepository).findActiveByProfileId(PROFILE_ID);
  }

  @Test
  void listFacilityOrders_returnsOrdersForFacilityVariants() {
    when(productClients.listListingVariantIdsForFacility(PROFILE_ID, "facility-1"))
        .thenReturn(List.of(LISTING_VARIANT_ID));
    BookingOrder order = samplePendingOrder();
    when(bookingOrderRepository.findActiveByListingVariantIdIn(List.of(LISTING_VARIANT_ID)))
        .thenReturn(List.of(order));

    List<BookingOrderResponse> responses = bookingOrderService.listFacilityOrders(PROFILE_ID, "facility-1");

    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).getId()).isEqualTo(ORDER_ID);
    verify(productClients).listListingVariantIdsForFacility(PROFILE_ID, "facility-1");
    verify(bookingOrderRepository).findActiveByListingVariantIdIn(List.of(LISTING_VARIANT_ID));
  }

  @Test
  void listFacilityOrders_emptyVariantIds_returnsEmptyWithoutQuery() {
    when(productClients.listListingVariantIdsForFacility(PROFILE_ID, "facility-1"))
        .thenReturn(List.of());

    List<BookingOrderResponse> responses = bookingOrderService.listFacilityOrders(PROFILE_ID, "facility-1");

    assertThat(responses).isEmpty();
    verify(bookingOrderRepository, never()).findActiveByListingVariantIdIn(any());
  }

  @Test
  void listFacilityOrders_blankFacilityId_throwsInvalidInput() {
    assertThatThrownBy(() -> bookingOrderService.listFacilityOrders(PROFILE_ID, "   "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

    verify(productClients, never()).listListingVariantIdsForFacility(any(), any());
    verify(bookingOrderRepository, never()).findActiveByListingVariantIdIn(any());
  }

  @Test
  void updateBookingOrderStatus_pendingToConfirmed_updatesStatus() {
    BookingOrder order = samplePendingOrder();
    when(bookingOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));
    when(bookingOrderRepository.save(order)).thenReturn(order);

    BookingOrderResponse response = bookingOrderService.updateBookingOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        BookingOrderStatusUpdateRequest.builder().status(BookingOrderStatus.CONFIRMED).build());

    assertThat(order.getStatus()).isEqualTo(BookingOrderStatus.CONFIRMED);
    assertThat(response.getStatus()).isEqualTo(BookingOrderStatus.CONFIRMED);
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void updateBookingOrderStatus_pendingToCancelled_releasesInventory() {
    BookingOrder order = samplePendingOrder();
    when(bookingOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));
    when(bookingOrderRepository.save(order)).thenReturn(order);

    bookingOrderService.updateBookingOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        BookingOrderStatusUpdateRequest.builder().status(BookingOrderStatus.CANCELLED).build());

    assertThat(order.getStatus()).isEqualTo(BookingOrderStatus.CANCELLED);
    verify(inventoryClients).releaseBuyReservation(ORDER_ID);
  }

  @Test
  void updateBookingOrderStatus_invalidTransition_throws() {
    BookingOrder order = samplePendingOrder();
    order.setStatus(BookingOrderStatus.CONFIRMED);
    when(bookingOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));

    BookingOrderStatusUpdateRequest request = BookingOrderStatusUpdateRequest.builder()
        .status(BookingOrderStatus.CANCELLED)
        .build();

    assertThatThrownBy(() -> bookingOrderService.updateBookingOrderStatus(PROFILE_ID, ORDER_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);

    verify(bookingOrderRepository, never()).save(any());
  }

  private static BookingOrder samplePendingOrder() {
    return BookingOrder.builder()
        .id(ORDER_ID)
        .customer(sampleCustomer())
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(PICKUP)
        .status(BookingOrderStatus.PENDING)
        .build();
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
