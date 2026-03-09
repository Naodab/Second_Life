package com.naodab.profileservice.dto.request;

import com.naodab.commonservice.constant.AppRegexp;

import jakarta.validation.constraints.Email;
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
public class ProfileCreateRequest {
  @Email(message = "INVALID_EMAIL")
  String email;

  @Pattern(regexp = AppRegexp.PHONE_NUMBER_REGEX, message = "INVALID_PHONE_NUMBER")
  String phoneNumber;

  @Pattern(regexp = AppRegexp.CHARACTER_ONLY_REGEX, message = "INVALID_FIRST_NAME")
  String firstName;

  @Pattern(regexp = AppRegexp.CHARACTER_ONLY_REGEX, message = "INVALID_LAST_NAME")
  String lastName;
}
