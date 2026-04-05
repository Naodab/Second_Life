package com.naodab.locationservice.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.naodab.locationservice.dto.request.ProvinceSearchRequest;
import com.naodab.locationservice.models.Province;
import com.naodab.locationservice.specification.helper.SpecificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import jakarta.persistence.criteria.Predicate;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProvinceSpecification {
  private final SpecificationHelper helper;

  public Specification<Province> build(ProvinceSearchRequest request) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (request.getName() != null) {
        helper.startWithStringPattern(predicates, criteriaBuilder, root, "name", request.getName());
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
