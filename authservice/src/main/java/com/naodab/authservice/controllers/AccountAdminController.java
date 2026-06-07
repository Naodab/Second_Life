package com.naodab.authservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.authservice.dto.response.AdminAccountActivitySummaryResponse;
import com.naodab.authservice.dto.response.AdminAccountResponse;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.services.AccountAdminService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.commonservice.response.PagedItemsResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountAdminController {

  AccountAdminService accountAdminService;

  @GetMapping("/accounts")
  public ResponseEntity<ApiResponse<PagedItemsResponse<AdminAccountResponse>>> listAccountsAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) Role accountRole,
      @RequestParam(required = false) Boolean emailVerified,
      @RequestParam(required = false) String keyword) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<PagedItemsResponse<AdminAccountResponse>>builder()
        .data(accountAdminService.listAccounts(page, pageSize, accountRole, emailVerified, keyword))
        .build());
  }

  @GetMapping("/accounts/{accountId}")
  public ResponseEntity<ApiResponse<AdminAccountResponse>> getAccountByIdAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @PathVariable String accountId) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<AdminAccountResponse>builder()
        .data(accountAdminService.getAccountById(accountId))
        .build());
  }

  @GetMapping("/accounts/{accountId}/activity-summary")
  public ResponseEntity<ApiResponse<AdminAccountActivitySummaryResponse>> getAccountActivitySummaryAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @PathVariable String accountId) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<AdminAccountActivitySummaryResponse>builder()
        .data(accountAdminService.getActivitySummary(accountId))
        .build());
  }

  private static void requireAdmin(String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }
}
