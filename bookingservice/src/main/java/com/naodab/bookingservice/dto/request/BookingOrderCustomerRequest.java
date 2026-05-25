package com.naodab.bookingservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class BookingOrderCustomerRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Size(max = 100, message = "FIELD_TOO_LONG")
  String firstName;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(max = 100, message = "FIELD_TOO_LONG")
  String lastName;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(max = 20, message = "FIELD_TOO_LONG")
  String phoneNumber;

  @NotBlank(message = "REQUIRED_FIELD")
  @Email(message = "INVALID_EMAIL")
  @Size(max = 255, message = "FIELD_TOO_LONG")
  String email;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "INVALID_ADDRESS")
  String address;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 1, max = 20, message = "PROVINCE_CODE_INVALID")
  String provinceCode;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 1, max = 20, message = "WARD_CODE_INVALID")
  String wardCode;
}
