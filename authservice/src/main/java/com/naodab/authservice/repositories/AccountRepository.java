package com.naodab.authservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
  Optional<Account> findByEmail(String email);
  Optional<Account> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
  boolean existsByEmail(String email);
  boolean existsByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
}
