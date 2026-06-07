package com.naodab.productservice.services.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.response.UserSellerActivityCountsResponse;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.services.UserActivityAdminService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserActivityAdminServiceImpl implements UserActivityAdminService {

  FacilityRepository facilityRepository;
  ProductRepository productRepository;
  ListingRepository listingRepository;
  ListingVariantRepository listingVariantRepository;

  @Override
  @Transactional(readOnly = true)
  public UserSellerActivityCountsResponse getSellerActivityCounts(String profileId) {
    String ownerId = requireProfileId(profileId);
    return UserSellerActivityCountsResponse.builder()
        .facilities(facilityRepository.countByOwnerIdAndDeletedAtIsNull(ownerId))
        .products(productRepository.countByOwnerIdAndDeletedAtIsNull(ownerId))
        .listings(listingRepository.countByFacilityOwnerIdAndFacilityDeletedAtIsNull(ownerId))
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public java.util.List<String> listListingVariantIdsForOwner(String profileId) {
    String ownerId = requireProfileId(profileId);
    return listingVariantRepository.findIdsByOwnerId(ownerId);
  }

  private static String requireProfileId(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileId.trim();
  }
}
