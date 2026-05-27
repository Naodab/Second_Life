package com.naodab.inventoryservice.services;

import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;

public interface InventoryReservationService {

  void createBuyReservation(InventoryReservationCreateEvent event);

  void createRentReservation(InventoryReservationCreateEvent event);

  void releaseReservation(String reservationId);

  void createFromEvent(InventoryReservationCreateEvent event);
}
