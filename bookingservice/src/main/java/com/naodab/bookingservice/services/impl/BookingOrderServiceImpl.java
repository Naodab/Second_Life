package com.naodab.bookingservice.services.impl;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.InventoryClients;
import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.request.BookingOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.bookingservice.services.OrderNotificationPublisher;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderServiceImpl implements BookingOrderService {

  private static final Map<BookingOrderStatus, Set<BookingOrderStatus>> SELLER_TRANSITIONS = Map.of(
      BookingOrderStatus.PENDING, Set.of(BookingOrderStatus.CONFIRMED, BookingOrderStatus.CANCELLED),
      BookingOrderStatus.CONFIRMED, Set.of(BookingOrderStatus.SHIPPED),
      BookingOrderStatus.SHIPPED, Set.of(BookingOrderStatus.DELIVERED));

  BookingOrderMapper bookingOrderMapper;
  BookingOrderRepository bookingOrderRepository;
  CustomerService customerService;
  InventoryClients inventoryClients;
  ProductClients productClients;
  OrderNotificationPublisher orderNotificationPublisher;

  @Override
  @Transactional
  public BookingOrderResponse createBookingOrder(String profileId, BookingOrderCreateRequest request) {
    Customer customer = customerService.getOwnedCustomerEntity(profileId, request.getCustomerId());

    BookingOrder bookingOrder = bookingOrderMapper.toBookingOrder(customer, request);
    bookingOrder.setId(UUID.randomUUID().toString());

    if (!validBuyInventory(bookingOrder.getListingVariantId(), bookingOrder.getQuantity())) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    }

    InventoryReservationCreateEvent reservationEvent = toReservationCreateEvent(bookingOrder, profileId);
    inventoryClients.createBuyReservation(reservationEvent);

    try {
      bookingOrder = bookingOrderRepository.save(bookingOrder);
    } catch (RuntimeException e) {
      inventoryClients.releaseBuyReservation(bookingOrder.getId());
      throw e;
    }

    orderNotificationPublisher.publishBuyOrderCreated(
        bookingOrder.getId(), bookingOrder.getListingVariantId(), profileId, customer);

    return bookingOrderMapper.toBookingOrderResponse(bookingOrder, customer);
  }

  private static InventoryReservationCreateEvent toReservationCreateEvent(BookingOrder order, String profileId) {
    return InventoryReservationCreateEvent.builder()
        .inventoryReservationId(order.getId())
        .listingVariantId(order.getListingVariantId())
        .customerId(profileId)
        .referenceId(order.getId())
        .quantity(order.getQuantity())
        .mode("BUY")
        .expiresAt(order.getPickupTime())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public List<BookingOrderResponse> listBookingOrders(String profileId) {
    return bookingOrderRepository.findActiveByProfileId(profileId).stream()
        .map(order -> bookingOrderMapper.toBookingOrderResponse(order, order.getCustomer()))
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<BookingOrderResponse> listFacilityOrders(String profileId, String facilityId) {
    if (!StringUtils.hasText(facilityId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    List<String> variantIds = ProductClients.emptyIfNull(
        productClients.listListingVariantIdsForFacility(profileId, facilityId.trim()));
    if (variantIds.isEmpty()) {
      return List.of();
    }
    return bookingOrderRepository.findActiveByListingVariantIdIn(variantIds).stream()
        .map(order -> bookingOrderMapper.toBookingOrderResponse(order, order.getCustomer()))
        .toList();
  }

  @Override
  @Transactional
  public BookingOrderResponse updateBookingOrderStatus(
      String profileId, String id, BookingOrderStatusUpdateRequest request) {
    if (id == null || id.isBlank() || request == null || request.getStatus() == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    BookingOrder order = bookingOrderRepository.findActiveById(id.trim())
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    assertSellerOwnsOrder(profileId, order);
    BookingOrderStatus targetStatus = request.getStatus();
    BookingOrderStatus currentStatus = order.getStatus();
    Set<BookingOrderStatus> allowed = SELLER_TRANSITIONS.get(currentStatus);
    if (allowed == null || !allowed.contains(targetStatus)) {
      throw new AppException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
    }
    order.setStatus(targetStatus);
    bookingOrderRepository.save(order);
    if (currentStatus == BookingOrderStatus.PENDING && targetStatus == BookingOrderStatus.CANCELLED) {
      inventoryClients.releaseBuyReservation(order.getId());
      orderNotificationPublisher.publishBuyOrderCancelledBySeller(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer());
    } else if (targetStatus == BookingOrderStatus.CONFIRMED) {
      orderNotificationPublisher.publishBuyOrderConfirmed(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer());
    } else if (targetStatus == BookingOrderStatus.SHIPPED || targetStatus == BookingOrderStatus.DELIVERED) {
      orderNotificationPublisher.publishBuyOrderStatusChanged(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer(),
          currentStatus.name(),
          targetStatus.name());
    }
    return bookingOrderMapper.toBookingOrderResponse(order, order.getCustomer());
  }

  private void assertSellerOwnsOrder(String profileId, BookingOrder order) {
    List<String> ownedVariantIds = ProductClients.emptyIfNull(
        productClients.listListingVariantIdsForOwner(profileId));
    if (!ownedVariantIds.contains(order.getListingVariantId())) {
      throw new AppException(ErrorCode.ORDER_NOT_FOUND);
    }
  }

  @Override
  @Transactional
  public void cancelBookingOrder(String profileId, String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    BookingOrder order = bookingOrderRepository.findActiveByIdAndProfileId(id.trim(), profileId)
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    if (order.getStatus() != BookingOrderStatus.PENDING) {
      throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
    }
    order.setStatus(BookingOrderStatus.CANCELLED);
    bookingOrderRepository.save(order);
    inventoryClients.releaseBuyReservation(order.getId());
    orderNotificationPublisher.publishBuyOrderCancelledByBuyer(
        order.getId(), order.getListingVariantId(), profileId, order.getCustomer());
  }

  private boolean validBuyInventory(String listingVariantId, int quantity) {
    Long buyInventoryCount = inventoryClients.getBuyInventoryCount(listingVariantId);
    return buyInventoryCount != null && buyInventoryCount >= quantity;
  }
}
