package com.naodab.bookingservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

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
public class BookingOrderCustomerResponse {
  String id;
  String profileId;
  String firstName;
  String lastName;
  String phoneNumber;
  String email;
  String address;

  String provinceCode;

  String wardCode;

  String provinceName;

  String wardName;

  @JsonProperty("isDefault")
  boolean defaultCustomer;
}
