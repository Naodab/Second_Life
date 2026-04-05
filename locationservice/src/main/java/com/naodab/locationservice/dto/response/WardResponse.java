package com.naodab.locationservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class WardResponse {
  Integer id;
  String code;
  String name;
  String nameEn;
  String fullName;
  String fullNameEn;
  String codeName;
  ProvinceResponse province;
}
