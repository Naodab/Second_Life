package com.naodab.locationservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.naodab.locationservice.models.Ward;

public interface WardRepository extends JpaRepository<Ward, Integer>, JpaSpecificationExecutor<Ward> {

  boolean existsByCode(String code);

  Optional<Ward> findByCode(String code);
}
