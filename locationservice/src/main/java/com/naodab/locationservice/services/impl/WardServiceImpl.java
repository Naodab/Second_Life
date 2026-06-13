package com.naodab.locationservice.services.impl;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.locationservice.config.CacheNames;
import com.naodab.locationservice.dto.request.WardSearchRequest;
import com.naodab.locationservice.dto.response.CoordinateResolveResponse;
import com.naodab.locationservice.dto.response.ProvinceResponse;
import com.naodab.locationservice.dto.response.WardResponse;
import com.naodab.locationservice.mapper.WardMapper;
import com.naodab.locationservice.models.Ward;
import com.naodab.locationservice.repositories.GisWardRepository;
import com.naodab.locationservice.repositories.WardRepository;
import com.naodab.locationservice.services.WardService;
import com.naodab.locationservice.specification.WardSpecification;
import com.naodab.locationservice.util.CoordinateNormalizer;
import com.naodab.locationservice.util.CoordinateNormalizer.LonLat;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WardServiceImpl implements WardService {

  WardRepository wardRepository;
  WardMapper wardMapper;
  WardSpecification wardSpecification;
  GisWardRepository gisWardRepository;

  private static LonLat normalizeLonLat(float lon, float lat) {
    return CoordinateNormalizer.normalize(lon, lat);
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'code:' + #code")
  public WardResponse getWard(String code) {
    return wardRepository.findByCode(code)
        .map(wardMapper::toWardResponse)
        .orElseThrow(() -> new AppException(ErrorCode.WARD_NOT_FOUND));
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'page:' + #page + ':' + #pageSize + ':' + (#request.name == null ? 'all' : #request.name)")
  public List<WardResponse> getWards(WardSearchRequest request, int page, int pageSize) {
    Specification<Ward> specification = wardSpecification.build(request);
    Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.ASC, "code"));
    return wardRepository.findAll(specification, pageable)
        .stream()
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

  private List<Ward> findWardsAtPoint(float lon, float lat) {
    return gisWardRepository.findWardCodesByLonAndLat(lon, lat).stream()
        .flatMap(code -> wardRepository.findByCode(code).stream())
        .toList();
  }

  private List<Ward> findWardsNearPoint(float lon, float lat, float radiusMeters) {
    return gisWardRepository.findWardCodesWithinRadius(lon, lat, radiusMeters).stream()
        .flatMap(code -> wardRepository.findByCode(code).stream())
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat + ':page:' + #page + ':pageSize:' + #pageSize")
  public List<WardResponse> getWardsWithinRadius(Float lat, Float lon, Float radiusMeters, int page, int pageSize) {
    LonLat coords = normalizeLonLat(lon, lat);
    return findWardsNearPoint(coords.longitude(), coords.latitude(), radiusMeters).stream()
        .map(ward -> wardMapper.toWardResponse(ward, true))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat + ':page:' + #page + ':pageSize:' + #pageSize")
  public List<WardResponse> getWardsByLonAndLat(Float lon, Float lat, int page, int pageSize) {
    LonLat coords = normalizeLonLat(lon, lat);
    return findWardsAtPoint(coords.longitude(), coords.latitude()).stream()
        .map(ward -> wardMapper.toWardResponse(ward, true))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat")
  public List<WardResponse> getWardsByLonAndLatWithoutPagination(Float lon, Float lat) {
    LonLat coords = normalizeLonLat(lon, lat);
    return findWardsAtPoint(coords.longitude(), coords.latitude()).stream()
        .map(ward -> wardMapper.toWardResponse(ward, true))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'resolve:' + #lon + ':' + #lat")
  public CoordinateResolveResponse resolveCoordinates(Float lon, Float lat) {
    LonLat coords = normalizeLonLat(lon, lat);
    lon = coords.longitude();
    lat = coords.latitude();
    List<Ward> wards = findWardsAtPoint(lon, lat);
    if (wards.isEmpty()) {
      wards = findWardsNearPoint(lon, lat, 2_000f);
    }
    if (wards.isEmpty()) {
      throw new AppException(ErrorCode.WARD_NOT_FOUND);
    }

    WardResponse ward = wardMapper.toWardResponse(wards.get(0), true);
    ProvinceResponse province = ward.getProvince();
    if (province == null || province.getCode() == null || province.getCode().isBlank()) {
      throw new AppException(ErrorCode.WARD_NOT_FOUND);
    }

    return CoordinateResolveResponse.builder()
        .latitude(lat)
        .longitude(lon)
        .wardCode(ward.getCode())
        .provinceCode(province.getCode())
        .wardName(ward.getFullName() != null ? ward.getFullName() : ward.getName())
        .provinceName(province.getFullName() != null ? province.getFullName() : province.getName())
        .build();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'all:' + (#request.name == null ? 'all' : #request.name) + ':' + (#request.provinceCode == null ? 'all' : #request.provinceCode)", condition = "#request.name != null || #request.provinceCode != null")
  public List<WardResponse> getAllWithoutPagination(WardSearchRequest request) {
    Specification<Ward> specification = wardSpecification.build(request);
    return wardRepository.findAll(specification, Sort.by(Sort.Direction.ASC, "code"))
        .stream()
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

  @Override
  public boolean isLocationValid(String provinceCode, String wardCode, Float latitude, Float longitude) {
    LonLat coords = CoordinateNormalizer.fromHttpParams(latitude, longitude);
    return gisWardRepository.countWardContainingPoint(
        wardCode, provinceCode, coords.longitude(), coords.latitude()) > 0;
  }

}
