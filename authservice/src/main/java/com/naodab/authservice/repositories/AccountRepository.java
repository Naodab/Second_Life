package com.naodab.authservice.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
  Optional<Account> findByEmail(String email);

  Optional<Account> findByProfileId(String profileId);
  Optional<Account> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
  boolean existsByEmail(String email);
  boolean existsByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);

  @Query("""
      SELECT a FROM Account a
      WHERE a.deletedAt IS NULL
        AND (:role IS NULL OR a.role = :role)
        AND (:emailVerified IS NULL OR a.emailVerified = :emailVerified)
        AND (:keyword IS NULL OR LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
      """)
  Page<Account> searchAdminAccounts(
      @Param("role") Role role,
      @Param("emailVerified") Boolean emailVerified,
      @Param("keyword") String keyword,
      Pageable pageable);
}
