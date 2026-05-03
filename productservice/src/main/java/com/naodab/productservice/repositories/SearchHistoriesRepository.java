package com.naodab.productservice.repositories;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.SearchHistories;

public interface SearchHistoriesRepository extends JpaRepository<SearchHistories, String> {

  Optional<SearchHistories> findByProfileId(String profileId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from SearchHistories s where s.profileId = :profileId")
  Optional<SearchHistories> findByProfileIdForUpdate(@Param("profileId") String profileId);
}
