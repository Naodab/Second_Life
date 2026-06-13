package com.naodab.locationservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.locationservice.dto.response.CoordinateResolveResponse;
import com.naodab.locationservice.dto.response.WardResponse;
import com.naodab.locationservice.mapper.ProvinceMapper;
import com.naodab.locationservice.mapper.WardMapper;
import com.naodab.locationservice.models.Province;
import com.naodab.locationservice.models.Ward;
import com.naodab.locationservice.repositories.GisWardRepository;
import com.naodab.locationservice.repositories.WardRepository;
import com.naodab.locationservice.specification.WardSpecification;

@ExtendWith(MockitoExtension.class)
class WardServiceImplTest {

  private static final float LON = 105.8156951f;
  private static final float LAT = 21.0144345f;

  @Mock
  WardRepository wardRepository;

  @Mock
  WardSpecification wardSpecification;

  @Mock
  GisWardRepository gisWardRepository;

  WardServiceImpl wardService;

  @BeforeEach
  void wireRealMappers() {
    WardMapper wardMapper = new WardMapper(new ProvinceMapper());
    wardService = new WardServiceImpl(
        wardRepository,
        wardMapper,
        wardSpecification,
        gisWardRepository);
  }

  @Test
  void resolveCoordinates_whenPointInsideWard_returnsCodesAndNames() {
    Ward ward = hanoiWard();
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of("00167"));
    when(wardRepository.findByCode("00167")).thenReturn(Optional.of(ward));

    CoordinateResolveResponse response = wardService.resolveCoordinates(LON, LAT);

    assertThat(response.getLatitude()).isEqualTo(LAT);
    assertThat(response.getLongitude()).isEqualTo(LON);
    assertThat(response.getWardCode()).isEqualTo("00167");
    assertThat(response.getProvinceCode()).isEqualTo("01");
    assertThat(response.getWardName()).isEqualTo("Phường Thịnh Quang");
    assertThat(response.getProvinceName()).isEqualTo("Thành phố Hà Nội");
    verify(gisWardRepository).findWardCodesByLonAndLat(LON, LAT);
    verifyNoMoreInteractions(gisWardRepository);
  }

  @Test
  void resolveCoordinates_whenExactMatchEmpty_fallsBackToRadiusSearch() {
    Ward ward = hcmWard();
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of());
    when(gisWardRepository.findWardCodesWithinRadius(LON, LAT, 2_000f)).thenReturn(List.of("26734"));
    when(wardRepository.findByCode("26734")).thenReturn(Optional.of(ward));

    CoordinateResolveResponse response = wardService.resolveCoordinates(LON, LAT);

    assertThat(response.getWardCode()).isEqualTo("26734");
    assertThat(response.getProvinceCode()).isEqualTo("79");
    verify(gisWardRepository).findWardCodesWithinRadius(LON, LAT, 2_000f);
  }

  @Test
  void resolveCoordinates_whenNoWardFound_throwsWardNotFound() {
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of());
    when(gisWardRepository.findWardCodesWithinRadius(LON, LAT, 2_000f)).thenReturn(List.of());

    assertThatThrownBy(() -> wardService.resolveCoordinates(LON, LAT))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WARD_NOT_FOUND);
  }

  @Test
  void resolveCoordinates_whenProvinceMissing_throwsWardNotFound() {
    Ward wardWithoutProvince = new Ward();
    wardWithoutProvince.setCode("99999");
    wardWithoutProvince.setName("Unknown");
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of("99999"));
    when(wardRepository.findByCode("99999")).thenReturn(Optional.of(wardWithoutProvince));

    assertThatThrownBy(() -> wardService.resolveCoordinates(LON, LAT))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WARD_NOT_FOUND);
  }

  @Test
  void getWardsByLonAndLatWithoutPagination_includesProvince() {
    Ward ward = hanoiWard();
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of("00167"));
    when(wardRepository.findByCode("00167")).thenReturn(Optional.of(ward));

    List<WardResponse> wards = wardService.getWardsByLonAndLatWithoutPagination(LON, LAT);

    assertThat(wards).hasSize(1);
    assertThat(wards.get(0).getCode()).isEqualTo("00167");
    assertThat(wards.get(0).getProvince()).isNotNull();
    assertThat(wards.get(0).getProvince().getCode()).isEqualTo("01");
  }

  @Test
  void getWardsWithinRadius_passesLonLatInCorrectOrder() {
    when(gisWardRepository.findWardCodesWithinRadius(eq(LON), eq(LAT), eq(500f))).thenReturn(List.of());

    wardService.getWardsWithinRadius(LAT, LON, 500f, 0, 20);

    verify(gisWardRepository).findWardCodesWithinRadius(LON, LAT, 500f);
  }

  @Test
  void resolveCoordinates_whenLatLonSwapped_normalizesBeforeQuery() {
    Ward ward = hanoiWard();
    when(gisWardRepository.findWardCodesByLonAndLat(LON, LAT)).thenReturn(List.of("00167"));
    when(wardRepository.findByCode("00167")).thenReturn(Optional.of(ward));

    CoordinateResolveResponse response = wardService.resolveCoordinates(LAT, LON);

    assertThat(response.getLatitude()).isEqualTo(LAT);
    assertThat(response.getLongitude()).isEqualTo(LON);
    verify(gisWardRepository).findWardCodesByLonAndLat(LON, LAT);
  }

  @Test
  void resolveCoordinates_whenLatitudeOutOfRange_throwsInvalidInput() {
    assertThatThrownBy(() -> wardService.resolveCoordinates(LON, 108f))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  private static Ward hanoiWard() {
    Province province = new Province();
    province.setCode("01");
    province.setName("Hà Nội");
    province.setFullName("Thành phố Hà Nội");

    Ward ward = new Ward();
    ward.setCode("00167");
    ward.setName("Thịnh Quang");
    ward.setFullName("Phường Thịnh Quang");
    ward.setProvince(province);
    return ward;
  }

  private static Ward hcmWard() {
    Province province = new Province();
    province.setCode("79");
    province.setName("TP. Hồ Chí Minh");
    province.setFullName("Thành phố Hồ Chí Minh");

    Ward ward = new Ward();
    ward.setCode("26734");
    ward.setName("Phường 4");
    ward.setFullName("Phường 4");
    ward.setProvince(province);
    return ward;
  }
}
