package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.request.RentalOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.ListingVariantContextResponse;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.mappers.RentalOrderMapper;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.RentalOrder;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.bookingservice.services.OrderNotificationPublisher;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class RentalOrderServiceImplTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String CUSTOMER_ID = "customer-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final String ORDER_ID = "order-1";
  private static final LocalDateTime START_TIME = LocalDateTime.of(2026, 7, 1, 10, 0, 0);
  private static final LocalDateTime END_TIME = LocalDateTime.of(2026, 7, 3, 10, 0, 0);

  @Mock
  RentalOrderRepository rentalOrderRepository;

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

  RentalOrderMapper rentalOrderMapper;
  RentalOrderServiceImpl rentalOrderService;

  @BeforeEach
  void setUp() {
    lenient()
        .when(locationClients.resolveLabels(anyString(), anyString()))
        .thenReturn(new LocationLabels("Ho Chi Minh", "Ben Nghe"));
    rentalOrderMapper = new RentalOrderMapper(new CustomerMapper(locationClients));
    rentalOrderService = new RentalOrderServiceImpl(
        rentalOrderMapper,
        rentalOrderRepository,
        customerService,
        inventoryClients,
        productClients,
        orderNotificationPublisher);
  }

  @Test
  void createRentalOrder_sufficientStock_reservesThenSavesOrder() {
    RentalOrderCreateRequest request = sampleRequest(2);
    Customer customer = sampleCustomer();
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(customer);
    when(inventoryClients.getRentInventoryCount(LISTING_VARIANT_ID, START_TIME, END_TIME)).thenReturn(5L);
    when(productClients.getListingVariantContext(LISTING_VARIANT_ID))
        .thenReturn(ListingVariantContextResponse.builder().facilityId("fac-1").build());
    when(rentalOrderRepository.save(any(RentalOrder.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    RentalOrderResponse response = rentalOrderService.createRentalOrder(PROFILE_ID, request);

    assertThat(response.getId()).isNotBlank();
    assertThat(response.getListingVariantId()).isEqualTo(LISTING_VARIANT_ID);
    assertThat(response.getCustomerId()).isEqualTo(CUSTOMER_ID);
    assertThat(response.getCustomer()).isNotNull();
    assertThat(response.getStatus()).isEqualTo(RentalOrderStatus.PENDING);

    ArgumentCaptor<InventoryReservationCreateEvent> eventCaptor =
        ArgumentCaptor.forClass(InventoryReservationCreateEvent.class);
    InOrder order = inOrder(inventoryClients, rentalOrderRepository);
    order.verify(inventoryClients).createRentReservation(eventCaptor.capture());
    order.verify(rentalOrderRepository).save(any(RentalOrder.class));
    verify(productClients).recordFacilityOrder("fac-1");
    verify(inventoryClients, never()).releaseBuyReservation(any());

    InventoryReservationCreateEvent event = eventCaptor.getValue();
    assertThat(event.getCustomerId()).isEqualTo(PROFILE_ID);
    assertThat(event.getListingVariantId()).isEqualTo(LISTING_VARIANT_ID);
    assertThat(event.getQuantity()).isEqualTo(2);
    assertThat(event.getMode()).isEqualTo("RENT");
    assertThat(event.getRentalSlotStart()).isEqualTo(START_TIME);
    assertThat(event.getRentalSlotEnd()).isEqualTo(END_TIME);
    assertThat(event.getInventoryReservationId()).isNotBlank();
  }

  @Test
  void createRentalOrder_saveFails_releasesReservation() {
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getRentInventoryCount(LISTING_VARIANT_ID, START_TIME, END_TIME)).thenReturn(3L);
    when(rentalOrderRepository.save(any(RentalOrder.class)))
        .thenThrow(new DataIntegrityViolationException("duplicate"));

    assertThatThrownBy(() -> rentalOrderService.createRentalOrder(PROFILE_ID, sampleRequest(1)))
        .isInstanceOf(DataIntegrityViolationException.class);

    verify(inventoryClients).createRentReservation(any());
    verify(inventoryClients).releaseBuyReservation(any());
  }

  @Test
  void createRentalOrder_insufficientStock_throwsBeforeReserveOrSave() {
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getRentInventoryCount(LISTING_VARIANT_ID, START_TIME, END_TIME)).thenReturn(1L);

    assertThatThrownBy(() -> rentalOrderService.createRentalOrder(PROFILE_ID, sampleRequest(2)))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);

    verify(inventoryClients, never()).createRentReservation(any());
    verify(rentalOrderRepository, never()).save(any());
  }

  @Test
  void createRentalOrder_nullInventoryCount_throwsBeforeReserveOrSave() {
    when(customerService.getOwnedCustomerEntity(PROFILE_ID, CUSTOMER_ID)).thenReturn(sampleCustomer());
    when(inventoryClients.getRentInventoryCount(LISTING_VARIANT_ID, START_TIME, END_TIME)).thenReturn(null);

    assertThatThrownBy(() -> rentalOrderService.createRentalOrder(PROFILE_ID, sampleRequest(1)))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);

    verify(inventoryClients, never()).createRentReservation(any());
    verify(rentalOrderRepository, never()).save(any());
  }

  @Test
  void createRentalOrder_endTimeBeforeStartTime_throwsBeforeAnyCall() {
    RentalOrderCreateRequest request = RentalOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .customerId(CUSTOMER_ID)
        .startTime(END_TIME)
        .endTime(START_TIME)
        .quantity(1)
        .build();

    assertThatThrownBy(() -> rentalOrderService.createRentalOrder(PROFILE_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

    verify(customerService, never()).getOwnedCustomerEntity(any(), any());
    verify(inventoryClients, never()).createRentReservation(any());
    verify(rentalOrderRepository, never()).save(any());
  }

  @Test
  void createRentalOrder_equalStartAndEndTime_throwsBeforeAnyCall() {
    RentalOrderCreateRequest request = RentalOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .customerId(CUSTOMER_ID)
        .startTime(START_TIME)
        .endTime(START_TIME)
        .quantity(1)
        .build();

    assertThatThrownBy(() -> rentalOrderService.createRentalOrder(PROFILE_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

    verify(customerService, never()).getOwnedCustomerEntity(any(), any());
  }

  @Test
  void cancelRentalOrder_pending_cancelsAndReleasesInventory() {
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.of(order));
    when(rentalOrderRepository.save(order)).thenReturn(order);

    rentalOrderService.cancelRentalOrder(PROFILE_ID, ORDER_ID);

    assertThat(order.getStatus()).isEqualTo(RentalOrderStatus.CANCELLED);
    verify(rentalOrderRepository).save(order);
    verify(inventoryClients).releaseBuyReservation(ORDER_ID);
  }

  @Test
  void cancelRentalOrder_confirmed_throwsAndDoesNotRelease() {
    RentalOrder order = samplePendingOrder();
    order.setStatus(RentalOrderStatus.CONFIRMED);
    when(rentalOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.of(order));

    assertThatThrownBy(() -> rentalOrderService.cancelRentalOrder(PROFILE_ID, ORDER_ID))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_CANCEL_NOT_ALLOWED);

    verify(rentalOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void cancelRentalOrder_notFound_throws() {
    when(rentalOrderRepository.findActiveByIdAndProfileId(ORDER_ID, PROFILE_ID))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> rentalOrderService.cancelRentalOrder(PROFILE_ID, ORDER_ID))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_NOT_FOUND);

    verify(rentalOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void listRentalOrders_returnsOrdersForProfile() {
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveByProfileId(PROFILE_ID)).thenReturn(List.of(order));

    List<RentalOrderResponse> responses = rentalOrderService.listRentalOrders(PROFILE_ID);

    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).getId()).isEqualTo(ORDER_ID);
    assertThat(responses.get(0).getCustomerId()).isEqualTo(CUSTOMER_ID);
    assertThat(responses.get(0).getListingVariantId()).isEqualTo(LISTING_VARIANT_ID);
    assertThat(responses.get(0).getStatus()).isEqualTo(RentalOrderStatus.PENDING);
    verify(rentalOrderRepository).findActiveByProfileId(PROFILE_ID);
  }

  @Test
  void listRentalOrders_returnsEmptyList() {
    when(rentalOrderRepository.findActiveByProfileId(PROFILE_ID)).thenReturn(List.of());

    List<RentalOrderResponse> responses = rentalOrderService.listRentalOrders(PROFILE_ID);

    assertThat(responses).isEmpty();
    verify(rentalOrderRepository).findActiveByProfileId(PROFILE_ID);
  }

  @Test
  void listFacilityRentalOrders_returnsOrdersForFacilityVariants() {
    when(productClients.listListingVariantIdsForFacility(PROFILE_ID, "facility-1"))
        .thenReturn(List.of(LISTING_VARIANT_ID));
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveByListingVariantIdIn(List.of(LISTING_VARIANT_ID)))
        .thenReturn(List.of(order));

    List<RentalOrderResponse> responses =
        rentalOrderService.listFacilityRentalOrders(PROFILE_ID, "facility-1");

    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).getId()).isEqualTo(ORDER_ID);
    verify(productClients).listListingVariantIdsForFacility(PROFILE_ID, "facility-1");
    verify(rentalOrderRepository).findActiveByListingVariantIdIn(List.of(LISTING_VARIANT_ID));
  }

  @Test
  void listFacilityRentalOrders_emptyVariantIds_returnsEmptyWithoutQuery() {
    when(productClients.listListingVariantIdsForFacility(PROFILE_ID, "facility-1"))
        .thenReturn(List.of());

    List<RentalOrderResponse> responses =
        rentalOrderService.listFacilityRentalOrders(PROFILE_ID, "facility-1");

    assertThat(responses).isEmpty();
    verify(rentalOrderRepository, never()).findActiveByListingVariantIdIn(any());
  }

  @Test
  void listFacilityRentalOrders_blankFacilityId_throwsInvalidInput() {
    assertThatThrownBy(() -> rentalOrderService.listFacilityRentalOrders(PROFILE_ID, "   "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

    verify(productClients, never()).listListingVariantIdsForFacility(any(), any());
    verify(rentalOrderRepository, never()).findActiveByListingVariantIdIn(any());
  }

  @Test
  void updateRentalOrderStatus_pendingToConfirmed_updatesStatus() {
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));
    when(rentalOrderRepository.save(order)).thenReturn(order);

    RentalOrderResponse response = rentalOrderService.updateRentalOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        RentalOrderStatusUpdateRequest.builder().status(RentalOrderStatus.CONFIRMED).build());

    assertThat(order.getStatus()).isEqualTo(RentalOrderStatus.CONFIRMED);
    assertThat(response.getStatus()).isEqualTo(RentalOrderStatus.CONFIRMED);
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void updateRentalOrderStatus_pendingToCancelled_releasesInventory() {
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));
    when(rentalOrderRepository.save(order)).thenReturn(order);

    rentalOrderService.updateRentalOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        RentalOrderStatusUpdateRequest.builder().status(RentalOrderStatus.CANCELLED).build());

    assertThat(order.getStatus()).isEqualTo(RentalOrderStatus.CANCELLED);
    verify(inventoryClients).releaseBuyReservation(ORDER_ID);
  }

  @Test
  void updateRentalOrderStatus_invalidTransition_throws() {
    RentalOrder order = samplePendingOrder();
    order.setStatus(RentalOrderStatus.CONFIRMED);
    when(rentalOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of(LISTING_VARIANT_ID));

    assertThatThrownBy(() -> rentalOrderService.updateRentalOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        RentalOrderStatusUpdateRequest.builder().status(RentalOrderStatus.CANCELLED).build()))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);

    verify(rentalOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  @Test
  void updateRentalOrderStatus_sellerDoesNotOwnVariant_throwsOrderNotFound() {
    RentalOrder order = samplePendingOrder();
    when(rentalOrderRepository.findActiveById(ORDER_ID)).thenReturn(Optional.of(order));
    when(productClients.listListingVariantIdsForOwner(PROFILE_ID)).thenReturn(List.of());

    assertThatThrownBy(() -> rentalOrderService.updateRentalOrderStatus(
        PROFILE_ID,
        ORDER_ID,
        RentalOrderStatusUpdateRequest.builder().status(RentalOrderStatus.CONFIRMED).build()))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_NOT_FOUND);

    verify(rentalOrderRepository, never()).save(any());
    verify(inventoryClients, never()).releaseBuyReservation(any());
  }

  private static RentalOrder samplePendingOrder() {
    return RentalOrder.builder()
        .id(ORDER_ID)
        .customer(sampleCustomer())
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .startTime(START_TIME)
        .endTime(END_TIME)
        .status(RentalOrderStatus.PENDING)
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

  private static RentalOrderCreateRequest sampleRequest(int quantity) {
    return RentalOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .customerId(CUSTOMER_ID)
        .startTime(START_TIME)
        .endTime(END_TIME)
        .quantity(quantity)
        .build();
  }
}
