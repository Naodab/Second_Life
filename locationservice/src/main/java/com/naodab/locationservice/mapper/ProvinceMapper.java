package com.naodab.locationservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.locationservice.dto.response.ProvinceResponse;
import com.naodab.locationservice.models.Province;

@Component
public class ProvinceMapper {
  public ProvinceResponse toProvinceResponse(Province province) {
    if (province == null) {
      return null;
    }

    return ProvinceResponse.builder()
        .id(province.getId())
        .code(province.getCode())
        .name(province.getName())
        .nameEn(province.getNameEn())
        .fullName(province.getFullName())
        .fullNameEn(province.getFullNameEn())
        .codeName(province.getCodeName())
        .build();
  }
}
