package com.naodab.productservice.services;

import java.util.List;

import org.springframework.util.StringUtils;

import com.naodab.productservice.dto.request.ListingRecommendationRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;

public interface ListingRecommendationService {

  List<ListingItemResponse> recommend(String profileId, ListingRecommendationRequest request);

  static String trimNullable(String v) {
    if (!StringUtils.hasText(v)) {
      return null;
    }
    return v.trim();
  }
}
