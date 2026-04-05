package com.naodab.locationservice.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.naodab.locationservice.specification.helper.SpecificationHelper;
import com.naodab.locationservice.dto.request.WardSearchRequest;
import com.naodab.locationservice.models.Ward;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WardSpecification {
  private final SpecificationHelper helper;

  public Specification<Ward> build(WardSearchRequest request) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (request.getName() != null) {
        helper.startWithStringPattern(predicates, criteriaBuilder, root, "name", request.getName());
      }

      if (request.getProvinceCode() != null) {
        helper.equal(predicates, criteriaBuilder, root, "province.code", request.getProvinceCode());
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
