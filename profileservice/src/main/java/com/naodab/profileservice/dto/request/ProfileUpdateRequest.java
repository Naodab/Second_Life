package com.naodab.profileservice.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProfileUpdateRequest {
  @Pattern(regexp = "^(\\+84|0)\\d{9}$", message = "INVALID_PHONE_NUMBER")
  String phoneNumber;

  @Pattern(regexp = "^[A-Za-z\\s]+$", message = "INVALID_FIRST_NAME")
  String firstName;

  @Pattern(regexp = "^[A-Za-z\\s]+$", message = "INVALID_LAST_NAME")
  String lastName;

  String avatarUrl;
}
