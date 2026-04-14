package com.naodab.productservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import jakarta.validation.constraints.Size;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FacilityUpdateRequest {
  @Size(min = 3, max = 255, message = "NAME_INVALID")
  String name;

  @Size(max = 1000, message = "DESCRIPTION_INVALID")
  String description;

  @Size(max = 255, message = "IMAGE_URL_INVALID")
  String imageUrl;

  @Size(max = 4096, message = "LINK_GOOGLE_MAP_INVALID")
  String linkGoogleMap;

  @Size(max = 255, message = "ADDRESS_INVALID")
  String address;

  @Size(max = 255, message = "PROVINCE_CODE_INVALID")
  String provinceCode;

  @Size(max = 255, message = "WARD_CODE_INVALID")
  String wardCode;
}
