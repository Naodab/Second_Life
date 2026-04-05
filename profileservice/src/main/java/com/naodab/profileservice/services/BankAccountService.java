package com.naodab.profileservice.services;

import java.util.List;

import com.naodab.profileservice.dto.request.BankAccountCreateRequest;
import com.naodab.profileservice.dto.request.BankAccountUpdateRequest;
import com.naodab.profileservice.dto.response.BankAccountResponse;

public interface BankAccountService {
  BankAccountResponse createBankAccount(BankAccountCreateRequest request);

  BankAccountResponse getBankAccountById(String id);

  BankAccountResponse updateBankAccount(String id, BankAccountUpdateRequest request);

  List<BankAccountResponse> getAllBankAccounts(int page, int pageSize);

  List<BankAccountResponse> searchBankAccounts(String query, int page, int pageSize);

  BankAccountResponse getBankAccountByAccountNumber(String accountNumber);

  void deleteBankAccount(String id);
}
