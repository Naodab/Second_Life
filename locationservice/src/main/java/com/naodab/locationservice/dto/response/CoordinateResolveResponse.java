package com.naodab.locationservice.dto.response;

import java.io.Serial;
import java.io.Serializable;

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
public class CoordinateResolveResponse implements Serializable {
  @Serial
  private static final long serialVersionUID = 1L;

  Float latitude;
  Float longitude;
  String wardCode;
  String provinceCode;
  String wardName;
  String provinceName;
}
