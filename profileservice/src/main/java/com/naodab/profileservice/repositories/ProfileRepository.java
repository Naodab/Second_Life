package com.naodab.profileservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.naodab.profileservice.entities.Profile;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
  boolean existsByEmail(String email);
  Optional<Profile> findByEmail(String email);
  List<Profile> findByDeletedAtIsNull(Pageable pageable);
}
