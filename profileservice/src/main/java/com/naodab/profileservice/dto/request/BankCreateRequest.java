package com.naodab.profileservice.dto.request;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import com.naodab.commonservice.constant.AppRegexp;
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
public class BankCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Pattern(regexp = AppRegexp.CHARACTER_ONLY_REGEX, message = "INVALID_BANK_NAME")
  String name;

  @NotBlank(message = "REQUIRED_FIELD")
  @Pattern(regexp = AppRegexp.CHARACTER_ONLY_REGEX, message = "INVALID_BANK_CODE")
  String code;

  MultipartFile logo;
}
