package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.response.UserSellerActivityCountsResponse;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;

@ExtendWith(MockitoExtension.class)
class UserActivityAdminServiceImplTest {

  @Mock
  FacilityRepository facilityRepository;

  @Mock
  ProductRepository productRepository;

  @Mock
  ListingRepository listingRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @InjectMocks
  UserActivityAdminServiceImpl userActivityAdminService;

  @Test
  void getSellerActivityCounts_aggregatesRepositoryCounts() {
    when(facilityRepository.countByOwnerIdAndDeletedAtIsNull("owner-1")).thenReturn(2L);
    when(productRepository.countByOwnerIdAndDeletedAtIsNull("owner-1")).thenReturn(5L);
    when(listingRepository.countByFacilityOwnerIdAndFacilityDeletedAtIsNull("owner-1")).thenReturn(3L);

    UserSellerActivityCountsResponse counts = userActivityAdminService.getSellerActivityCounts(" owner-1 ");

    assertThat(counts.getFacilities()).isEqualTo(2);
    assertThat(counts.getProducts()).isEqualTo(5);
    assertThat(counts.getListings()).isEqualTo(3);
  }

  @Test
  void getSellerActivityCounts_blankProfileId_throws() {
    assertThatThrownBy(() -> userActivityAdminService.getSellerActivityCounts(" "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void listListingVariantIdsForOwner_trimsProfileId() {
    when(listingVariantRepository.findIdsByOwnerId("owner-1"))
        .thenReturn(List.of("variant-1", "variant-2"));

    List<String> ids = userActivityAdminService.listListingVariantIdsForOwner(" owner-1 ");

    assertThat(ids).containsExactly("variant-1", "variant-2");
    verify(listingVariantRepository).findIdsByOwnerId("owner-1");
  }

  @Test
  void listListingVariantIdsForOwner_blankProfileId_throws() {
    assertThatThrownBy(() -> userActivityAdminService.listListingVariantIdsForOwner(null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }
}
