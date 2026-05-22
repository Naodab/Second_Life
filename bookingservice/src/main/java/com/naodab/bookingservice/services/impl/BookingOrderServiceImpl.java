package com.naodab.bookingservice.services.impl;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.bookingservice.clients.InventoryClients;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.mappers.BookingOrderMapper;
import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderServiceImpl implements BookingOrderService {

  BookingOrderMapper bookingOrderMapper;
  BookingOrderRepository bookingOrderRepository;
  InventoryClients inventoryClients;

  @Override
  @Transactional
  public BookingOrderResponse createBookingOrder(String customerId, BookingOrderCreateRequest request) {
    BookingOrder bookingOrder = bookingOrderMapper.toBookingOrder(customerId, request);
    bookingOrder.setId(UUID.randomUUID().toString());

    if (!validBuyInventory(bookingOrder.getListingVariantId(), bookingOrder.getQuantity())) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    }

    InventoryReservationCreateEvent reservationEvent = toReservationCreateEvent(bookingOrder);
    inventoryClients.createBuyReservation(reservationEvent);

    try {
      bookingOrder = bookingOrderRepository.save(bookingOrder);
    } catch (RuntimeException e) {
      inventoryClients.releaseBuyReservation(bookingOrder.getId());
      throw e;
    }

    return bookingOrderMapper.toBookingOrderResponse(bookingOrder);
  }

  private static InventoryReservationCreateEvent toReservationCreateEvent(BookingOrder order) {
    return InventoryReservationCreateEvent.builder()
        .inventoryReservationId(order.getId())
        .listingVariantId(order.getListingVariantId())
        .customerId(order.getCustomerId())
        .referenceId(order.getId())
        .quantity(order.getQuantity())
        .mode("BUY")
        .expiresAt(order.getPickupTime())
        .build();
  }

  @Override
  public void deleteBookingOrder(String id) {
  }

  private boolean validBuyInventory(String listingVariantId, int quantity) {
    Long buyInventoryCount = inventoryClients.getBuyInventoryCount(listingVariantId);
    return buyInventoryCount != null && buyInventoryCount >= quantity;
  }
}
