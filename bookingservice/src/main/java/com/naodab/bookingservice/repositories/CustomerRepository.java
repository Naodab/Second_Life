package com.naodab.bookingservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.bookingservice.models.Customer;

public interface CustomerRepository extends JpaRepository<Customer, String> {
  List<Customer> findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(String profileId);

  Optional<Customer> findByIdAndProfileIdAndDeletedAtIsNull(String id, String profileId);

  long countByProfileIdAndDeletedAtIsNull(String profileId);
}
