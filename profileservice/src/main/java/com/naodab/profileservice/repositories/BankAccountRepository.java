package com.naodab.profileservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.profileservice.entities.BankAccount;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, String> {
  boolean existsByAccountNumber(String accountNumber);

  Optional<BankAccount> findByAccountNumber(String accountNumber);

  List<BankAccount> findByProfileId(String profileId, Pageable pageable);
}
