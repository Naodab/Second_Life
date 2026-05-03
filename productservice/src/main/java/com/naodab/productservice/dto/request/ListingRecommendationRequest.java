package com.naodab.productservice.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class ListingRecommendationRequest {

  Float latitude;

  Float longitude;

  Float radiusMeters;

  String provinceCode;

  String wardCode;

  @Min(1)
  @Max(50)
  @Builder.Default
  Integer limit = 12;
}
