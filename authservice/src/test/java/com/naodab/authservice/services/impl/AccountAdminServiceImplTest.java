package com.naodab.authservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.authservice.clients.ProfileClient;
import com.naodab.authservice.clients.UserActivityClient;
import com.naodab.authservice.dto.response.AdminAccountActivitySummaryResponse;
import com.naodab.authservice.dto.response.AdminAccountBuyerActivitySummary;
import com.naodab.authservice.dto.response.AdminAccountSellerActivitySummary;
import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.PagedItemsResponse;

@ExtendWith(MockitoExtension.class)
class AccountAdminServiceImplTest {

  @Mock
  AccountRepository accountRepository;

  @Mock
  ProfileClient profileClient;

  @Mock
  UserActivityClient userActivityClient;

  @InjectMocks
  AccountAdminServiceImpl accountAdminService;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(accountAdminService, "defaultPageSize", 20);
  }

  @Test
  void listAccounts_mapsAccountsAndProfiles() {
    Account account = Account.builder()
        .id("acc-1")
        .email("user@example.com")
        .role(Role.USER)
        .authProvider(AuthProvider.LOCAL)
        .emailVerified(true)
        .active(true)
        .profileId("profile-1")
        .build();
    account.setCreatedAt(LocalDateTime.parse("2026-06-01T10:00:00"));

    when(accountRepository.searchAdminAccounts(isNull(), isNull(), isNull(), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(account), org.springframework.data.domain.PageRequest.of(0, 20), 1));
    when(profileClient.getProfileById("profile-1"))
        .thenReturn(Optional.of(ProfileResponse.builder()
            .id("profile-1")
            .firstName("An")
            .lastName("Bùi")
            .phoneNumber("0900000000")
            .avatarUrl("https://example.com/a.jpg")
            .build()));

    PagedItemsResponse<?> result = accountAdminService.listAccounts(0, 20, null, null, null);

    assertThat(result.getTotalCount()).isEqualTo(1);
    assertThat(result.getItems()).hasSize(1);
    assertThat(result.getItems().getFirst()).isInstanceOf(com.naodab.authservice.dto.response.AdminAccountResponse.class);
    var mapped = (com.naodab.authservice.dto.response.AdminAccountResponse) result.getItems().getFirst();
    assertThat(mapped.getEmail()).isEqualTo("user@example.com");
    assertThat(mapped.getProfile().getFirstName()).isEqualTo("An");
  }

  @Test
  void getAccountById_returnsMappedAccount() {
    Account account = activeAccount("acc-1", "profile-1");
    when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account));
    when(profileClient.getProfileById("profile-1"))
        .thenReturn(Optional.of(ProfileResponse.builder()
            .id("profile-1")
            .firstName("An")
            .lastName("Bùi")
            .build()));

    var result = accountAdminService.getAccountById("acc-1");

    assertThat(result.getEmail()).isEqualTo("user@example.com");
    assertThat(result.getProfileId()).isEqualTo("profile-1");
    assertThat(result.getProfile().getLastName()).isEqualTo("Bùi");
  }

  @Test
  void getAccountById_whenMissing_throwsNotFound() {
    when(accountRepository.findById("missing")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> accountAdminService.getAccountById("missing"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
  }

  @Test
  void getAccountById_whenDeleted_throwsNotFound() {
    Account account = activeAccount("acc-1", "profile-1");
    account.setDeletedAt(LocalDateTime.now());
    when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account));

    assertThatThrownBy(() -> accountAdminService.getAccountById("acc-1"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
  }

  @Test
  void getAccountById_blankId_throwsInvalidInput() {
    assertThatThrownBy(() -> accountAdminService.getAccountById("  "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void getActivitySummary_delegatesToClientWithProfileId() {
    Account account = activeAccount("acc-1", "profile-1");
    when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account));
    when(userActivityClient.getActivitySummary("profile-1"))
        .thenReturn(AdminAccountActivitySummaryResponse.builder()
            .seller(AdminAccountSellerActivitySummary.builder().facilities(2).build())
            .buyer(AdminAccountBuyerActivitySummary.builder().buyOrders(1).build())
            .build());

    var result = accountAdminService.getActivitySummary("acc-1");

    assertThat(result.getSeller().getFacilities()).isEqualTo(2);
    assertThat(result.getBuyer().getBuyOrders()).isEqualTo(1);
  }

  @Test
  void getActivitySummary_withoutProfileId_returnsEmptySummary() {
    Account account = activeAccount("acc-1", null);
    when(accountRepository.findById("acc-1")).thenReturn(Optional.of(account));
    when(userActivityClient.getActivitySummary(null))
        .thenReturn(AdminAccountActivitySummaryResponse.builder()
            .seller(AdminAccountSellerActivitySummary.builder().build())
            .buyer(AdminAccountBuyerActivitySummary.builder().build())
            .build());

    var result = accountAdminService.getActivitySummary("acc-1");

    assertThat(result.getSeller().getProducts()).isZero();
    assertThat(result.getBuyer().getRentOrders()).isZero();
  }

  private static Account activeAccount(String id, String profileId) {
    Account account = Account.builder()
        .id(id)
        .email("user@example.com")
        .role(Role.USER)
        .authProvider(AuthProvider.LOCAL)
        .emailVerified(true)
        .active(true)
        .profileId(profileId)
        .build();
    account.setCreatedAt(LocalDateTime.parse("2026-06-01T10:00:00"));
    return account;
  }
}
