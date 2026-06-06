package com.naodab.authservice.services;

import com.naodab.authservice.dto.response.AdminAccountResponse;
import com.naodab.authservice.models.Account.Role;
import com.naodab.commonservice.response.PagedItemsResponse;

public interface AccountAdminService {
  PagedItemsResponse<AdminAccountResponse> listAccounts(
      Integer page,
      Integer pageSize,
      Role role,
      Boolean emailVerified,
      String keyword);
}
