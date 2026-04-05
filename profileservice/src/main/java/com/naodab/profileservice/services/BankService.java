package com.naodab.profileservice.services;

import java.util.List;

import com.naodab.profileservice.dto.request.BankCreateRequest;
import com.naodab.profileservice.dto.request.BankUpdateRequest;
import com.naodab.profileservice.dto.response.BankResponse;

public interface BankService {
  BankResponse createBank(BankCreateRequest request);

  BankResponse getBankById(String id);

  BankResponse updateBank(String id, BankUpdateRequest request);

  List<BankResponse> getAllBanks(int page, int pageSize);

  List<BankResponse> searchBanks(String query, int page, int pageSize);

  BankResponse getBankByCode(String code);

  void deleteBank(String id);
}
