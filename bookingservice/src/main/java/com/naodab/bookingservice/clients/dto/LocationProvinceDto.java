package com.naodab.bookingservice.clients.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class LocationProvinceDto {
  String code;
  String name;
  String fullName;
}
