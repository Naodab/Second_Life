package com.naodab.authservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.naodab.authservice.dto.response.AdminAccountActivitySummaryResponse;
import com.naodab.authservice.dto.response.AdminAccountBuyerActivitySummary;
import com.naodab.authservice.dto.response.AdminAccountResponse;
import com.naodab.authservice.dto.response.AdminAccountSellerActivitySummary;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.services.AccountAdminService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.commonservice.response.PagedItemsResponse;

@ExtendWith(MockitoExtension.class)
class AccountAdminControllerTest {

  @Mock
  AccountAdminService accountAdminService;

  @InjectMocks
  AccountAdminController accountAdminController;

  MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(accountAdminController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();
  }

  @Test
  void listAccounts_requiresAdmin() throws Exception {
    mockMvc.perform(get("/auth/admin/accounts")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value(1050));

    verify(accountAdminService, never()).listAccounts(any(), any(), any(), any(), any());
  }

  @Test
  void listAccounts_adminOk() throws Exception {
    when(accountAdminService.listAccounts(eq(0), eq(20), isNull(), isNull(), isNull()))
        .thenReturn(PagedItemsResponse.<AdminAccountResponse>builder()
            .page(0)
            .pageSize(20)
            .totalCount(1)
            .items(List.of(AdminAccountResponse.builder()
                .id("acc-1")
                .email("user@example.com")
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(true)
                .active(true)
                .profileId("profile-1")
                .createdAt(LocalDateTime.parse("2026-06-01T10:00:00"))
                .build()))
            .build());

    mockMvc.perform(get("/auth/admin/accounts")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN)
        .param("page", "0")
        .param("pageSize", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(1))
        .andExpect(jsonPath("$.data.items[0].email").value("user@example.com"));

    verify(accountAdminService).listAccounts(0, 20, null, null, null);
  }

  @Test
  void getAccountById_requiresAdmin() throws Exception {
    mockMvc.perform(get("/auth/admin/accounts/acc-1")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden());

    verify(accountAdminService, never()).getAccountById(anyString());
  }

  @Test
  void getAccountById_adminOk() throws Exception {
    when(accountAdminService.getAccountById("acc-1"))
        .thenReturn(AdminAccountResponse.builder()
            .id("acc-1")
            .email("user@example.com")
            .role(Role.USER)
            .authProvider(AuthProvider.LOCAL)
            .emailVerified(true)
            .active(true)
            .build());

    mockMvc.perform(get("/auth/admin/accounts/acc-1")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.email").value("user@example.com"));

    verify(accountAdminService).getAccountById("acc-1");
  }

  @Test
  void getActivitySummary_requiresAdmin() throws Exception {
    mockMvc.perform(get("/auth/admin/accounts/acc-1/activity-summary")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden());

    verify(accountAdminService, never()).getActivitySummary(anyString());
  }

  @Test
  void getActivitySummary_adminOk() throws Exception {
    when(accountAdminService.getActivitySummary("acc-1"))
        .thenReturn(AdminAccountActivitySummaryResponse.builder()
            .seller(AdminAccountSellerActivitySummary.builder()
                .facilities(1)
                .products(2)
                .listings(3)
                .buyOrdersReceived(4)
                .rentOrdersReceived(5)
                .build())
            .buyer(AdminAccountBuyerActivitySummary.builder()
                .buyOrders(6)
                .rentOrders(7)
                .build())
            .build());

    mockMvc.perform(get("/auth/admin/accounts/acc-1/activity-summary")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.seller.facilities").value(1))
        .andExpect(jsonPath("$.data.seller.products").value(2))
        .andExpect(jsonPath("$.data.buyer.buyOrders").value(6));

    verify(accountAdminService).getActivitySummary("acc-1");
  }
}
