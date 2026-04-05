package com.naodab.locationservice.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.naodab.locationservice.models.Province;

public interface ProvinceRepository extends JpaRepository<Province, Integer>, JpaSpecificationExecutor<Province> {

  boolean existsByCode(String code);

  Optional<Province> findByCode(String code);
}
