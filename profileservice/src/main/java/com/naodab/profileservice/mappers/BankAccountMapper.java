package com.naodab.profileservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.request.BankAccountCreateRequest;
import com.naodab.profileservice.dto.request.BankAccountUpdateRequest;
import com.naodab.profileservice.dto.response.BankAccountResponse;
import com.naodab.profileservice.entities.BankAccount;

import lombok.RequiredArgsConstructor;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BankAccountMapper {
  BankMapper bankMapper;

  public BankAccountResponse toBankAccountResponse(BankAccount bankAccount) {
    if (bankAccount == null) {
      return null;
    }

    return BankAccountResponse.builder()
        .id(bankAccount.getId())
        .bank(bankMapper.toBankResponse(bankAccount.getBank()))
        .accountNumber(bankAccount.getAccountNumber())
        .accountName(bankAccount.getAccountName())
        .qrCodeUrl(bankAccount.getQrCodeUrl())
        .build();
  }

  public BankAccount toBankAccount(BankAccountCreateRequest request) {
    if (request == null) {
      return null;
    }

    return BankAccount.builder()
        .accountNumber(request.getAccountNumber())
        .accountName(request.getAccountName())
        .build();
  }

  public BankAccount toBankAccount(BankAccount bankAccount, BankAccountUpdateRequest request) {
    if (bankAccount == null || request == null) {
      return bankAccount;
    }

    if (request.getAccountNumber() != null) {
      bankAccount.setAccountNumber(request.getAccountNumber());
    }

    if (request.getAccountName() != null) {
      bankAccount.setAccountName(request.getAccountName());
    }

    return bankAccount;
  }
}
