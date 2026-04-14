package com.naodab.productservice.dto.response;

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
public class FacilityResponse {
  String id;
  String name;
  String ownerId;
  String description;
  String imageUrl;
  String linkGoogleMap;
  String address;
  String provinceCode;
  String wardCode;
  Float latitude;
  Float longitude;
  Long viewCount;
  Long orderCount;
  Float averageRating;
}
