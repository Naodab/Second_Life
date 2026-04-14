package com.naodab.productservice.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.request.FacilitySearchRequest;
import com.naodab.productservice.models.Facility;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class FacilitySpecification {

  public Specification<Facility> build(FacilitySearchRequest request) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

      if (request.getName() != null) {
        predicates.add(criteriaBuilder.like(root.get("name"), "%" + request.getName() + "%"));
      }

      if (request.getProvinceCode() != null) {
        predicates.add(criteriaBuilder.equal(root.get("provinceCode"), request.getProvinceCode()));
      }

      if (request.getWardCode() != null) {
        predicates.add(criteriaBuilder.equal(root.get("wardCode"), request.getWardCode()));
      }

      if (request.getType() != null) {
        predicates.add(criteriaBuilder.equal(root.get("type"), request.getType()));
      }

      if (request.getStatus() != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), request.getStatus()));
      }

      if (request.getOwnerId() != null) {
        predicates.add(criteriaBuilder.equal(root.get("ownerId"), request.getOwnerId()));
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
