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
import com.naodab.locationservice.dto.request.ProvinceSearchRequest;
import com.naodab.locationservice.dto.response.ProvinceResponse;
import com.naodab.locationservice.mapper.ProvinceMapper;
import com.naodab.locationservice.models.GisProvince;
import com.naodab.locationservice.models.Province;
import com.naodab.locationservice.repositories.ProvinceRepository;
import com.naodab.locationservice.repositories.GisProvinceRepository;
import com.naodab.locationservice.services.ProvinceService;
import com.naodab.locationservice.specification.ProvinceSpecification;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProvinceServiceImpl implements ProvinceService {
  ProvinceRepository provinceRepository;
  ProvinceMapper provinceMapper;
  ProvinceSpecification provinceSpecification;
  GisProvinceRepository gisProvinceRepository;

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'code:' + #code")
  public ProvinceResponse getProvince(String code) {
    return provinceRepository.findByCode(code)
        .map(provinceMapper::toProvinceResponse)
        .orElseThrow(() -> new AppException(ErrorCode.PROVINCE_NOT_FOUND));
  }

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'page:' + #page + ':' + #pageSize + ':' + (#request.name == null ? 'all' : #request.name)")
  public List<ProvinceResponse> getProvinces(ProvinceSearchRequest request, int page, int pageSize) {
    Specification<Province> specification = provinceSpecification.build(request);
    Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.ASC, "code"));
    return provinceRepository.findAll(specification, pageable)
        .stream()
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }

  @Override
  public List<ProvinceResponse> getProvincesWithinRadius(Float lat, Float lon, Float radiusMeters, int page,
      int pageSize) {
    List<GisProvince> gisProvinces = gisProvinceRepository.findWithinRadius(lat, lon, radiusMeters);
    return gisProvinces.stream()
        .map(gisProvince -> gisProvince.getProvince())
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'lon:' + #lon + ':lat:' + #lat + ':page:' + #page + ':pageSize:' + #pageSize")
  public List<ProvinceResponse> getProvincesByLonAndLat(Float lon, Float lat, int page, int pageSize) {
    List<GisProvince> gisProvinces = gisProvinceRepository.findByLonAndLat(lon, lat);
    return gisProvinces.stream()
        .map(gisProvince -> gisProvince.getProvince())
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'lon:' + #lon + ':lat:' + #lat")
  public List<ProvinceResponse> getProvincesByLonAndLatWithoutPagination(Float lon, Float lat) {
    List<GisProvince> gisProvinces = gisProvinceRepository.findByLonAndLat(lon, lat);
    return gisProvinces.stream()
        .map(gisProvince -> gisProvince.getProvince())
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'all'")
  public List<ProvinceResponse> getAllWithoutPagination() {
    return provinceRepository.findAll(Sort.by(Sort.Direction.ASC, "code"))
        .stream()
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }

  @Override
  @Cacheable(cacheNames = CacheNames.PROVINCES, key = "'list:' + (#request.name == null ? 'all' : #request.name)")
  public List<ProvinceResponse> getProvincesWithoutPagination(ProvinceSearchRequest request) {
    Specification<Province> specification = provinceSpecification.build(request);
    return provinceRepository.findAll(specification, Sort.by(Sort.Direction.ASC, "code"))
        .stream()
        .map(provinceMapper::toProvinceResponse)
        .toList();
  }
}
