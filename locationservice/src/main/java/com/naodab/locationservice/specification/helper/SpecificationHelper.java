package com.naodab.locationservice.specification.helper;

import java.util.List;

import org.springframework.stereotype.Component;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Predicate;

@Component
public class SpecificationHelper {
  public <T> void equal(List<Predicate> predicates, CriteriaBuilder criteriaBuilder, Root<T> root,
      String field, String value) {
    if (value != null) {
      predicates.add(criteriaBuilder.equal(root.get(field), value));
    }
  }

  public <T> void likeStringPattern(List<Predicate> predicates, CriteriaBuilder criteriaBuilder, Root<T> root,
      String field, String value) {
    if (value != null) {
      predicates.add(criteriaBuilder.like(root.get(field), "%" + value + "%"));
    }
  }

  public <T> void startWithStringPattern(List<Predicate> predicates, CriteriaBuilder criteriaBuilder,
      Root<T> root,
      String field, String value) {
    if (value != null) {
      predicates.add(criteriaBuilder.like(root.get(field), value + "%"));
    }
  }

  public <T> void endWithStringPattern(List<Predicate> predicates, CriteriaBuilder criteriaBuilder, Root<T> root,
      String field, String value) {
    if (value != null) {
      predicates.add(criteriaBuilder.like(root.get(field), "%" + value));
    }
  }
}
