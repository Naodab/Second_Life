package com.naodab.productservice.services.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.FacilityCreateRequest;
import com.naodab.productservice.dto.request.FacilitySearchRequest;
import com.naodab.productservice.dto.request.FacilityUpdateRequest;
import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.services.FacilityService;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.mapper.FacilityMapper;
import com.naodab.productservice.client.LocationClient;
import com.naodab.productservice.specification.FacilitySpecification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class FacilityServiceImpl implements FacilityService {
  FacilityRepository facilityRepository;
  ListingVariantRepository listingVariantRepository;
  FacilitySpecification facilitySpecification;
  FacilityMapper facilityMapper;
  LocationClient locationClient;

  @NonFinal
  @Value("${sort.facilities.default:created_at}")
  String defaultSort;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  @Override
  public FacilityResponse createFacility(String profileId, FacilityCreateRequest request) {
    Facility facility = facilityMapper.toFacility(request);
    validateForCreate(facility);
    facility.setOwnerId(profileId);

    facility = facilityRepository.save(facility);
    return facilityMapper.toFacilityResponse(facility);
  }

  @Override
  public FacilityResponse getFacilityById(String id) {
    Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
    return facilityMapper.toFacilityResponse(facility);
  }

  @Override
  public List<FacilityResponse> getAllFacilities(Integer page, Integer pageSize) {
    Sort sort = Sort.by(Sort.Direction.DESC, defaultSort);
    Pageable pageable = PageRequest.of(normalizePage(page), normalizePageSize(pageSize), sort);
    return facilityRepository.findAllByDeletedAtIsNull(pageable)
        .stream()
        .map(facilityMapper::toFacilityResponse)
        .toList();
  }

  @Override
  public List<FacilityResponse> searchFacilities(Integer page, Integer pageSize, FacilitySearchRequest request) {
    Specification<Facility> specification = facilitySpecification.build(request);
    Sort sort = Sort.by(Sort.Direction.DESC, defaultSort);

    Pageable pageable = PageRequest.of(normalizePage(page), normalizePageSize(pageSize), sort);
    return facilityRepository.findAll(specification, pageable)
        .stream()
        .map(facilityMapper::toFacilityResponse)
        .toList();
  }

  private int normalizePage(Integer page) {
    return page == null || page < 0 ? 0 : page;
  }

  private int normalizePageSize(Integer pageSize) {
    return pageSize == null || pageSize <= 0 ? defaultPageSize : pageSize;
  }

  @Override
  public FacilityResponse updateFacility(String id, FacilityUpdateRequest request) {
    Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));

    facility = facilityMapper.toFacility(facility, request);
    validateForUpdate(facility);

    facility = facilityRepository.save(facility);
    return facilityMapper.toFacilityResponse(facility);
  }

  @Override
  public void deleteFacility(String id) {
    Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));

    facility.setDeletedAt(LocalDateTime.now());
    facilityRepository.save(facility);
  }

  private void validateForCreate(Facility facility) {
    if (facility == null) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    }

    if (facilityRepository.existsByOwnerIdAndNameAndDeletedAtIsNull(facility.getOwnerId(), facility.getName())) {
      throw new AppException(ErrorCode.FACILITY_ALREADY_EXISTS);
    }

    assertLocationValid(facility);
  }

  private void validateForUpdate(Facility facility) {
    if (facility == null) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    }

    if (facilityRepository.existsByOwnerIdAndNameAndIdNotAndDeletedAtIsNull(
        facility.getOwnerId(), facility.getName(), facility.getId())) {
      throw new AppException(ErrorCode.FACILITY_ALREADY_EXISTS);
    }

    assertLocationValid(facility);
  }

  private void assertLocationValid(Facility facility) {
    if (!locationClient.validLocation(facility.getProvinceCode(), facility.getWardCode(), facility.getLatitude(),
        facility.getLongitude())) {
      throw new AppException(ErrorCode.FACILITY_LOCATION_INVALID);
    }
  }

  @Override
  public void uploadMainImageFacility(String id, String ownerId, String imageUrl) {
    Facility facility = facilityRepository.findByIdAndOwnerIdAndDeletedAtIsNull(id, ownerId)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
    if (!facility.getOwnerId().equals(ownerId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    if (!StringUtils.hasText(imageUrl)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    facility.setImageUrl(imageUrl.trim());
    facilityRepository.save(facility);
  }

  @Override
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<String> listListingVariantIdsForFacility(String profileId, String facilityId) {
    if (!StringUtils.hasText(profileId) || !StringUtils.hasText(facilityId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    facilityRepository.findByOwnerIdAndIdAndDeletedAtIsNull(profileId.trim(), facilityId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
    return listingVariantRepository.findIdsByFacilityId(facilityId.trim());
  }

  @Override
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<String> listListingVariantIdsForOwner(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return listingVariantRepository.findIdsByOwnerId(profileId.trim());
  }

}
