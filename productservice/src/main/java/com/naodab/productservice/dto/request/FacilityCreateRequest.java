package com.naodab.productservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FacilityCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "NAME_INVALID")
  String name;

  @Size(max = 1000, message = "DESCRIPTION_INVALID")
  String description;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 4096, message = "LINK_GOOGLE_MAP_INVALID")
  String linkGoogleMap;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "ADDRESS_INVALID")
  String address;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "PROVINCE_CODE_INVALID")
  String provinceCode;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "WARD_CODE_INVALID")
  String wardCode;
}
