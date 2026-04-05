package com.naodab.profileservice.dto.request;

import org.springframework.web.multipart.MultipartFile;

import com.naodab.commonservice.constant.AppRegexp;

import jakarta.validation.constraints.NotBlank;
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
public class BankAccountUpdateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Pattern(regexp = AppRegexp.BANK_ACCOUNT_NUMBER_REGEX, message = "INVALID_BANK_ACCOUNT_NUMBER")
  String accountNumber;

  @NotBlank(message = "REQUIRED_FIELD")
  @Pattern(regexp = AppRegexp.CHARACTER_ONLY_REGEX, message = "INVALID_ACCOUNT_NAME")
  String accountName;

  MultipartFile qrCode;
}
