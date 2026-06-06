package com.naodab.authservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.commonservice.response.PagedItemsResponse;

@ExtendWith(MockitoExtension.class)
class AccountAdminServiceImplTest {

  @Mock
  AccountRepository accountRepository;

  @Mock
  ProfileClient profileClient;

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
}
