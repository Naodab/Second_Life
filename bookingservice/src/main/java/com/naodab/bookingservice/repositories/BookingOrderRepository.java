package com.naodab.bookingservice.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.bookingservice.models.BookingOrder;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;

public interface BookingOrderRepository extends JpaRepository<BookingOrder, String> {
  List<BookingOrder> findByCustomer_Id(String customerId);

  List<BookingOrder> findByListingVariantId(String listingVariantId);

  List<BookingOrder> findByStatus(BookingOrderStatus status);

  List<BookingOrder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

  List<BookingOrder> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

  List<BookingOrder> findByDeletedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

  List<BookingOrder> findByDeletedAtIsNull(Pageable pageable);

  List<BookingOrder> findByDeletedAtIsNotNull(Pageable pageable);

  List<BookingOrder> findByCustomer_IdAndDeletedAtIsNull(String customerId, Pageable pageable);

  List<BookingOrder> findByListingVariantIdAndDeletedAtIsNull(String listingVariantId, Pageable pageable);

  List<BookingOrder> findByStatusAndDeletedAtIsNull(BookingOrderStatus status, Pageable pageable);

  List<BookingOrder> findByCreatedAtBetweenAndDeletedAtIsNull(LocalDateTime startDate, LocalDateTime endDate,
      Pageable pageable);

  List<BookingOrder> findByUpdatedAtBetweenAndDeletedAtIsNull(LocalDateTime startDate, LocalDateTime endDate,
      Pageable pageable);

}
