package com.naodab.profileservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.profileservice.entities.Bank;

@Repository
public interface BankRepository extends JpaRepository<Bank, String> {
  boolean existsByName(String name);

  boolean existsByCode(String code);

  Optional<Bank> findByName(String name);

  Optional<Bank> findByCode(String code);

}
