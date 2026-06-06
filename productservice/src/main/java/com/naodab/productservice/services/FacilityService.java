package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.FacilityCreateRequest;
import com.naodab.productservice.dto.request.FacilitySearchRequest;
import com.naodab.productservice.dto.request.FacilityUpdateRequest;
import com.naodab.productservice.dto.response.FacilityResponse;

public interface FacilityService {
  FacilityResponse createFacility(String profileId, FacilityCreateRequest request);

  FacilityResponse getFacilityById(String id);

  List<FacilityResponse> getAllFacilities(Integer page, Integer pageSize);

  List<FacilityResponse> searchFacilities(Integer page, Integer pageSize, FacilitySearchRequest request);

  FacilityResponse updateFacility(String id, FacilityUpdateRequest request);

  void deleteFacility(String id);

  void uploadMainImageFacility(String id, String ownerId, String imageUrl);

  List<String> listListingVariantIdsForFacility(String profileId, String facilityId);

  List<String> listListingVariantIdsForOwner(String profileId);

  String resolveOwnerProfileIdByListingVariantId(String listingVariantId);

  void recordView(String facilityId);

  void recordOrder(String facilityId);
}
