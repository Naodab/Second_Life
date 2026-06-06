package com.naodab.bookingservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.bookingservice.models.RentalOrder;

public interface RentalOrderRepository extends JpaRepository<RentalOrder, String> {

  @Query("""
      SELECT o FROM RentalOrder o
      JOIN FETCH o.customer c
      WHERE c.profileId = :profileId AND o.deletedAt IS NULL
      ORDER BY o.createdAt DESC
      """)
  List<RentalOrder> findActiveByProfileId(@Param("profileId") String profileId);

  @Query("""
      SELECT o FROM RentalOrder o
      JOIN FETCH o.customer c
      WHERE o.id = :id AND c.profileId = :profileId AND o.deletedAt IS NULL
      """)
  Optional<RentalOrder> findActiveByIdAndProfileId(@Param("id") String id, @Param("profileId") String profileId);

  @Query("""
      SELECT o FROM RentalOrder o
      JOIN FETCH o.customer c
      WHERE o.id = :id AND o.deletedAt IS NULL
      """)
  Optional<RentalOrder> findActiveById(@Param("id") String id);

  @Query("""
      SELECT o FROM RentalOrder o
      JOIN FETCH o.customer c
      WHERE o.listingVariantId IN :variantIds AND o.deletedAt IS NULL
      ORDER BY o.createdAt DESC
      """)
  List<RentalOrder> findActiveByListingVariantIdIn(@Param("variantIds") List<String> variantIds);

  @Query(value = """
      SELECT o FROM RentalOrder o
      JOIN FETCH o.customer
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
      ORDER BY o.createdAt DESC
      """,
      countQuery = """
      SELECT COUNT(o) FROM RentalOrder o
      WHERE o.deletedAt IS NULL
        AND (:status IS NULL OR o.status = :status)
      """)
  Page<RentalOrder> findAdminPage(@Param("status") RentalOrderStatus status, Pageable pageable);
}
