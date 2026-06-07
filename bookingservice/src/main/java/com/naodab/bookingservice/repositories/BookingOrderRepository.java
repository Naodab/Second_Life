package com.naodab.bookingservice.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

  @Query("""
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE c.profileId = :profileId AND o.deletedAt IS NULL
      ORDER BY o.createdAt DESC
      """)
  List<BookingOrder> findActiveByProfileId(@Param("profileId") String profileId);

  @Query("""
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE o.id = :id AND c.profileId = :profileId AND o.deletedAt IS NULL
      """)
  Optional<BookingOrder> findActiveByIdAndProfileId(@Param("id") String id, @Param("profileId") String profileId);

  @Query("""
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE o.id = :id AND o.deletedAt IS NULL
      """)
  Optional<BookingOrder> findActiveById(@Param("id") String id);

  @Query("""
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE o.listingVariantId IN :variantIds AND o.deletedAt IS NULL
      ORDER BY o.createdAt DESC
      """)
  List<BookingOrder> findActiveByListingVariantIdIn(@Param("variantIds") List<String> variantIds);

  @Query(value = """
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
      ORDER BY o.createdAt DESC
      """,
      countQuery = """
      SELECT COUNT(o) FROM BookingOrder o
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
      """)
  Page<BookingOrder> findAdminPage(@Param("status") BookingOrderStatus status, Pageable pageable);

  @Query("SELECT COUNT(o) FROM BookingOrder o JOIN o.customer c WHERE c.profileId = :profileId AND o.deletedAt IS NULL")
  long countActiveByBuyerProfileId(@Param("profileId") String profileId);

  @Query("SELECT COUNT(o) FROM BookingOrder o WHERE o.listingVariantId IN :variantIds AND o.deletedAt IS NULL")
  long countActiveByListingVariantIdIn(@Param("variantIds") List<String> variantIds);

  @Query(value = """
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
        AND c.profileId = :buyerProfileId
      ORDER BY o.createdAt DESC
      """,
      countQuery = """
      SELECT COUNT(o) FROM BookingOrder o
      JOIN o.customer c
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
        AND c.profileId = :buyerProfileId
      """)
  Page<BookingOrder> findAdminPageByBuyerProfileId(
      @Param("status") BookingOrderStatus status,
      @Param("buyerProfileId") String buyerProfileId,
      Pageable pageable);

  @Query(value = """
      SELECT o FROM BookingOrder o
      JOIN FETCH o.customer c
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
        AND o.listingVariantId IN :variantIds
      ORDER BY o.createdAt DESC
      """,
      countQuery = """
      SELECT COUNT(o) FROM BookingOrder o
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
        AND o.listingVariantId IN :variantIds
      """)
  Page<BookingOrder> findAdminPageByListingVariantIdIn(
      @Param("status") BookingOrderStatus status,
      @Param("variantIds") List<String> variantIds,
      Pageable pageable);

}
