package com.naodab.productservice.mapper;

import com.naodab.commonservice.constant.AppRegexp;
import com.naodab.productservice.dto.request.FacilityCreateRequest;
import com.naodab.productservice.dto.request.FacilityUpdateRequest;
import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.models.Facility;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class FacilityMapper {

  public Facility toFacility(FacilityCreateRequest request) {
    if (request == null) {
      return null;
    }

    Facility facility = Facility.builder()
        .name(request.getName())
        .description(request.getDescription())
        .linkGoogleMap(request.getLinkGoogleMap())
        .address(request.getAddress())
        .provinceCode(request.getProvinceCode())
        .wardCode(request.getWardCode())
        .email(trimToNull(request.getEmail()))
        .phoneNumber(trimToNull(request.getPhoneNumber()))
        .build();

    parseLatAndLong(facility, request.getLinkGoogleMap());
    return facility;
  }

  public FacilityResponse toFacilityResponse(Facility facility) {
    if (facility == null) {
      return null;
    }

    return FacilityResponse.builder()
        .id(facility.getId())
        .name(facility.getName())
        .ownerId(facility.getOwnerId())
        .description(facility.getDescription())
        .imageUrl(facility.getImageUrl())
        .linkGoogleMap(facility.getLinkGoogleMap())
        .address(facility.getAddress())
        .provinceCode(facility.getProvinceCode())
        .wardCode(facility.getWardCode())
        .email(facility.getEmail())
        .phoneNumber(facility.getPhoneNumber())
        .latitude(facility.getLatitude())
        .longitude(facility.getLongitude())
        .viewCount(facility.getViewCount())
        .orderCount(facility.getOrderCount())
        .averageRating(facility.getAverageRating())
        .build();
  }

  public Facility toFacility(Facility facility, FacilityUpdateRequest request) {
    if (facility == null || request == null) {
      return facility;
    }

    if (request.getName() != null) {
      facility.setName(request.getName());
    }

    if (request.getDescription() != null) {
      facility.setDescription(request.getDescription());
    }

    if (request.getImageUrl() != null) {
      facility.setImageUrl(request.getImageUrl());
    }

    if (request.getLinkGoogleMap() != null) {
      facility.setLinkGoogleMap(request.getLinkGoogleMap());
      parseLatAndLong(facility, request.getLinkGoogleMap());
    }

    if (request.getAddress() != null) {
      facility.setAddress(request.getAddress());
    }

    if (request.getProvinceCode() != null) {
      facility.setProvinceCode(request.getProvinceCode());
    }

    if (request.getWardCode() != null) {
      facility.setWardCode(request.getWardCode());
    }

    if (request.getEmail() != null) {
      facility.setEmail(trimToNull(request.getEmail()));
    }

    if (request.getPhoneNumber() != null) {
      facility.setPhoneNumber(trimToNull(request.getPhoneNumber()));
    }

    return facility;
  }

  private static String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private void parseLatAndLong(Facility facility, String linkGoogleMap) {
    if (linkGoogleMap == null) {
      return;
    }

    Pattern coordinatesPattern = Pattern.compile(AppRegexp.COORDINATES_REGEX);
    Matcher matcher = coordinatesPattern.matcher(linkGoogleMap);
    if (matcher.find()) {
      String latitude = matcher.group(2);
      String longitude = matcher.group(1);
      facility.setLatitude(Float.parseFloat(latitude));
      facility.setLongitude(Float.parseFloat(longitude));
    }
  }
}
