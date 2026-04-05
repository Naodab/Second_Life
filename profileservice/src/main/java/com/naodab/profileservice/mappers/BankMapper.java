package com.naodab.profileservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.request.BankCreateRequest;
import com.naodab.profileservice.dto.request.BankUpdateRequest;
import com.naodab.profileservice.dto.response.BankResponse;
import com.naodab.profileservice.entities.Bank;

@Component
public class BankMapper {
  public BankResponse toBankResponse(Bank bank) {
    if (bank == null) {
      return null;
    }

    return BankResponse.builder()
        .id(bank.getId())
        .name(bank.getName())
        .code(bank.getCode())
        .logoUrl(bank.getLogoUrl())
        .build();
  }

  public Bank toBank(BankCreateRequest request) {
    if (request == null) {
      return null;
    }

    return Bank.builder()
        .name(request.getName())
        .code(request.getCode())
        .build();
  }

  public Bank toBank(Bank bank, BankUpdateRequest request) {
    if (bank == null || request == null) {
      return bank;
    }

    if (request.getName() != null) {
      bank.setName(request.getName());
    }

    if (request.getCode() != null) {
      bank.setCode(request.getCode());
    }

    return bank;
  }
}
