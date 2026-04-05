package com.naodab.locationservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.locationservice.dto.response.WardResponse;
import com.naodab.locationservice.models.Ward;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WardMapper {
  ProvinceMapper provinceMapper;

  public WardResponse toWardResponse(Ward ward) {
    return toWardResponse(ward, true);
  }

  public WardResponse toWardResponse(Ward ward, boolean includeProvince) {
    if (ward == null) {
      return null;
    }

    return WardResponse.builder()
        .id(ward.getId())
        .code(ward.getCode())
        .name(ward.getName())
        .nameEn(ward.getNameEn())
        .fullName(ward.getFullName())
        .fullNameEn(ward.getFullNameEn())
        .codeName(ward.getCodeName())
        .province(includeProvince ? provinceMapper.toProvinceResponse(ward.getProvince()) : null)
        .build();
  }

}
