package com.naodab.inventoryservice.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.models.InventoryReservation;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, String> {

  @Query("""
      SELECT COALESCE(SUM(r.quantity), 0)
      FROM InventoryReservation r
      WHERE r.listingVariantId = :listingVariantId
        AND r.mode = :mode
        AND r.status IN :statuses
        AND r.deletedAt IS NULL
        AND (r.expiresAt IS NULL OR r.expiresAt > :now)
      """)
  long sumActiveReservedQuantity(
      @Param("listingVariantId") String listingVariantId,
      @Param("mode") InventoryItem.InventoryMode mode,
      @Param("statuses") List<InventoryReservation.ReservationStatus> statuses,
      @Param("now") LocalDateTime now);

  @Query("""
      SELECT r FROM InventoryReservation r
      WHERE r.listingVariantId = :listingVariantId
        AND r.mode = :mode
        AND r.deletedAt IS NULL
        AND r.status IN :statuses
        AND (
          (r.rentalStart IS NOT NULL AND r.rentalEnd IS NOT NULL)
          OR (r.rentalSlotStart IS NOT NULL AND r.rentalSlotEnd IS NOT NULL)
        )
      ORDER BY r.rentalSlotStart ASC NULLS LAST, r.rentalStart ASC NULLS LAST
      """)
  List<InventoryReservation> findRentalPeriodsByListingVariant(
      @Param("listingVariantId") String listingVariantId,
      @Param("mode") InventoryItem.InventoryMode mode,
      @Param("statuses") List<InventoryReservation.ReservationStatus> statuses);
}
