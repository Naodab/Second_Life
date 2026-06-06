package com.naodab.authservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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

import com.naodab.authservice.dto.response.AdminAccountResponse;
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
}
