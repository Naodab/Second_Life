package com.naodab.profileservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class BankAccountResponse {
  String id;
  BankResponse bank;
  String accountNumber;
  String accountName;
  String qrCodeUrl;
}
