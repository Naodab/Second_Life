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
import com.naodab.locationservice.dto.response.WardResponse;
import com.naodab.locationservice.mapper.WardMapper;
import com.naodab.locationservice.models.GisWard;
import com.naodab.locationservice.models.Ward;
import com.naodab.locationservice.repositories.GisWardRepository;
import com.naodab.locationservice.repositories.WardRepository;
import com.naodab.locationservice.services.WardService;
import com.naodab.locationservice.specification.WardSpecification;

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

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat + ':page:' + #page + ':pageSize:' + #pageSize")
  public List<WardResponse> getWardsWithinRadius(Float lat, Float lon, Float radiusMeters, int page, int pageSize) {
    List<GisWard> gisWards = gisWardRepository.findWithinRadius(lat, lon, radiusMeters);
    return gisWards.stream()
        .map(gisWard -> gisWard.getWard())
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat + ':page:' + #page + ':pageSize:' + #pageSize")
  public List<WardResponse> getWardsByLonAndLat(Float lon, Float lat, int page, int pageSize) {
    List<GisWard> gisWards = gisWardRepository.findByLonAndLat(lon, lat);
    return gisWards.stream()
        .map(gisWard -> gisWard.getWard())
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'lon:' + #lon + ':lat:' + #lat")
  public List<WardResponse> getWardsByLonAndLatWithoutPagination(Float lon, Float lat) {
    List<GisWard> gisWards = gisWardRepository.findByLonAndLat(lon, lat);
    return gisWards.stream()
        .map(gisWard -> gisWard.getWard())
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.WARDS, key = "'all'")
  public List<WardResponse> getAllWithoutPagination(WardSearchRequest request) {
    Specification<Ward> specification = wardSpecification.build(request);
    return wardRepository.findAll(specification, Sort.by(Sort.Direction.ASC, "code"))
        .stream()
        .map(ward -> wardMapper.toWardResponse(ward, false))
        .toList();
  }

}
