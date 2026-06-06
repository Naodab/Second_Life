package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.client.LocationClient;
import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.mapper.FacilityMapper;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.specification.FacilitySpecification;

@ExtendWith(MockitoExtension.class)
class FacilityServiceImplTest {

  @Mock
  FacilityRepository facilityRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @Mock
  FacilitySpecification facilitySpecification;

  @Mock
  FacilityMapper facilityMapper;

  @Mock
  LocationClient locationClient;

  @InjectMocks
  FacilityServiceImpl facilityService;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(facilityService, "defaultSort", "created_at");
    ReflectionTestUtils.setField(facilityService, "defaultPageSize", 20);
  }

  @Test
  void getFacilityById_incrementsViewCountInResponse() {
    Facility facility = Facility.builder()
        .id("fac-1")
        .name("Shop")
        .viewCount(3L)
        .build();
    when(facilityRepository.findByIdAndDeletedAtIsNull("fac-1")).thenReturn(Optional.of(facility));
    when(facilityMapper.toFacilityResponse(facility)).thenReturn(
        FacilityResponse.builder().id("fac-1").viewCount(4L).build());

    FacilityResponse response = facilityService.getFacilityById("fac-1");

    verify(facilityRepository).incrementViewCount("fac-1");
    assertThat(facility.getViewCount()).isEqualTo(4L);
    assertThat(response.getViewCount()).isEqualTo(4L);
  }

  @Test
  void recordOrder_incrementsOrderCount() {
    when(facilityRepository.incrementOrderCount("fac-1")).thenReturn(1);

    facilityService.recordOrder("fac-1");

    verify(facilityRepository).incrementOrderCount("fac-1");
  }

  @Test
  void recordOrder_missingFacility_throws() {
    when(facilityRepository.incrementOrderCount("missing")).thenReturn(0);

    assertThatThrownBy(() -> facilityService.recordOrder("missing"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FACILITY_NOT_FOUND);
  }
}
