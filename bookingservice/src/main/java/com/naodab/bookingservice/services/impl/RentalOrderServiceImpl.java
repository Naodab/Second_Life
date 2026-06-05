package com.naodab.bookingservice.services.impl;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.InventoryClients;
import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.request.RentalOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.mappers.RentalOrderMapper;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.models.RentalOrder;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.bookingservice.services.OrderNotificationPublisher;
import com.naodab.bookingservice.services.RentalOrderService;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RentalOrderServiceImpl implements RentalOrderService {

  private static final Map<RentalOrderStatus, Set<RentalOrderStatus>> SELLER_TRANSITIONS = Map.of(
      RentalOrderStatus.PENDING, Set.of(RentalOrderStatus.CONFIRMED, RentalOrderStatus.CANCELLED),
      RentalOrderStatus.CONFIRMED, Set.of(RentalOrderStatus.DELIVERED),
      RentalOrderStatus.DELIVERED, Set.of(RentalOrderStatus.RETURNED),
      RentalOrderStatus.RETURNED, Set.of(RentalOrderStatus.COMPLETED));

  RentalOrderMapper rentalOrderMapper;
  RentalOrderRepository rentalOrderRepository;
  CustomerService customerService;
  InventoryClients inventoryClients;
  ProductClients productClients;
  OrderNotificationPublisher orderNotificationPublisher;

  @Override
  @Transactional
  public RentalOrderResponse createRentalOrder(String profileId, RentalOrderCreateRequest request) {
    if (request.getEndTime() == null
        || request.getStartTime() == null
        || !request.getEndTime().isAfter(request.getStartTime())) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Customer customer = customerService.getOwnedCustomerEntity(profileId, request.getCustomerId());

    RentalOrder rentalOrder = rentalOrderMapper.toRentalOrder(customer, request);
    rentalOrder.setId(UUID.randomUUID().toString());

    if (!validRentInventory(
        rentalOrder.getListingVariantId(),
        rentalOrder.getQuantity(),
        rentalOrder.getStartTime(),
        rentalOrder.getEndTime())) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    }

    InventoryReservationCreateEvent reservationEvent = toReservationCreateEvent(rentalOrder, profileId);
    inventoryClients.createRentReservation(reservationEvent);

    try {
      rentalOrder = rentalOrderRepository.save(rentalOrder);
    } catch (RuntimeException e) {
      inventoryClients.releaseBuyReservation(rentalOrder.getId());
      throw e;
    }

    orderNotificationPublisher.publishRentOrderCreated(
        rentalOrder.getId(), rentalOrder.getListingVariantId(), profileId, customer);

    return rentalOrderMapper.toRentalOrderResponse(rentalOrder, customer);
  }

  private static InventoryReservationCreateEvent toReservationCreateEvent(RentalOrder order, String profileId) {
    return InventoryReservationCreateEvent.builder()
        .inventoryReservationId(order.getId())
        .listingVariantId(order.getListingVariantId())
        .customerId(profileId)
        .referenceId(order.getId())
        .quantity(order.getQuantity())
        .mode("RENT")
        .rentalSlotStart(order.getStartTime())
        .rentalSlotEnd(order.getEndTime())
        .expiresAt(order.getEndTime())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public List<RentalOrderResponse> listRentalOrders(String profileId) {
    return rentalOrderRepository.findActiveByProfileId(profileId).stream()
        .map(order -> rentalOrderMapper.toRentalOrderResponse(order, order.getCustomer()))
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<RentalOrderResponse> listFacilityRentalOrders(String profileId, String facilityId) {
    if (!StringUtils.hasText(facilityId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    List<String> variantIds = ProductClients.emptyIfNull(
        productClients.listListingVariantIdsForFacility(profileId, facilityId.trim()));
    if (variantIds.isEmpty()) {
      return List.of();
    }
    return rentalOrderRepository.findActiveByListingVariantIdIn(variantIds).stream()
        .map(order -> rentalOrderMapper.toRentalOrderResponse(order, order.getCustomer()))
        .toList();
  }

  @Override
  @Transactional
  public RentalOrderResponse updateRentalOrderStatus(
      String profileId, String id, RentalOrderStatusUpdateRequest request) {
    if (id == null || id.isBlank() || request == null || request.getStatus() == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    RentalOrder order = rentalOrderRepository.findActiveById(id.trim())
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    assertSellerOwnsOrder(profileId, order);
    RentalOrderStatus targetStatus = request.getStatus();
    RentalOrderStatus currentStatus = order.getStatus();
    Set<RentalOrderStatus> allowed = SELLER_TRANSITIONS.get(currentStatus);
    if (allowed == null || !allowed.contains(targetStatus)) {
      throw new AppException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
    }
    order.setStatus(targetStatus);
    rentalOrderRepository.save(order);
    if (currentStatus == RentalOrderStatus.PENDING && targetStatus == RentalOrderStatus.CANCELLED) {
      inventoryClients.releaseBuyReservation(order.getId());
      orderNotificationPublisher.publishRentOrderCancelledBySeller(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer());
    } else if (targetStatus == RentalOrderStatus.CONFIRMED) {
      orderNotificationPublisher.publishRentOrderConfirmed(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer());
    } else if (targetStatus == RentalOrderStatus.DELIVERED
        || targetStatus == RentalOrderStatus.RETURNED
        || targetStatus == RentalOrderStatus.COMPLETED) {
      orderNotificationPublisher.publishRentOrderStatusChanged(
          order.getId(),
          order.getListingVariantId(),
          order.getCustomer().getProfileId(),
          order.getCustomer(),
          currentStatus.name(),
          targetStatus.name());
    }
    return rentalOrderMapper.toRentalOrderResponse(order, order.getCustomer());
  }

  private void assertSellerOwnsOrder(String profileId, RentalOrder order) {
    List<String> ownedVariantIds = ProductClients.emptyIfNull(
        productClients.listListingVariantIdsForOwner(profileId));
    if (!ownedVariantIds.contains(order.getListingVariantId())) {
      throw new AppException(ErrorCode.ORDER_NOT_FOUND);
    }
  }

  @Override
  @Transactional
  public void cancelRentalOrder(String profileId, String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    RentalOrder order = rentalOrderRepository.findActiveByIdAndProfileId(id.trim(), profileId)
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    if (order.getStatus() != RentalOrderStatus.PENDING) {
      throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
    }
    order.setStatus(RentalOrderStatus.CANCELLED);
    rentalOrderRepository.save(order);
    inventoryClients.releaseBuyReservation(order.getId());
    orderNotificationPublisher.publishRentOrderCancelledByBuyer(
        order.getId(), order.getListingVariantId(), profileId, order.getCustomer());
  }

  private boolean validRentInventory(
      String listingVariantId, int quantity, LocalDateTime startTime, LocalDateTime endTime) {
    Long rentInventoryCount = inventoryClients.getRentInventoryCount(listingVariantId, startTime, endTime);
    return rentInventoryCount != null && rentInventoryCount >= quantity;
  }
}
