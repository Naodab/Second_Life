package com.naodab.authservice.services.impl;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.authservice.clients.ProfileClient;
import com.naodab.authservice.dto.response.AdminAccountProfileSummary;
import com.naodab.authservice.dto.response.AdminAccountResponse;
import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.services.AccountAdminService;
import com.naodab.commonservice.response.PagedItemsResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountAdminServiceImpl implements AccountAdminService {

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  AccountRepository accountRepository;
  ProfileClient profileClient;

  @Override
  @Transactional(readOnly = true)
  public PagedItemsResponse<AdminAccountResponse> listAccounts(
      Integer page,
      Integer pageSize,
      Role role,
      Boolean emailVerified,
      String keyword) {
    int normalizedPage = normalizePage(page);
    int normalizedSize = normalizePageSize(pageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

    String trimmedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;
    Page<Account> accountPage = accountRepository.searchAdminAccounts(role, emailVerified, trimmedKeyword, pageable);

    List<AdminAccountResponse> items = accountPage.getContent().stream()
        .map(this::toAdminAccountResponse)
        .filter(Objects::nonNull)
        .toList();

    return PagedItemsResponse.<AdminAccountResponse>builder()
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .totalCount(accountPage.getTotalElements())
        .items(items)
        .build();
  }

  private AdminAccountResponse toAdminAccountResponse(Account account) {
    AdminAccountProfileSummary profileSummary = null;
    if (StringUtils.hasText(account.getProfileId())) {
      profileSummary = profileClient.getProfileById(account.getProfileId().trim())
          .map(this::toProfileSummary)
          .orElse(null);
    }
    return AdminAccountResponse.builder()
        .id(account.getId())
        .email(account.getEmail())
        .role(account.getRole())
        .authProvider(account.getAuthProvider())
        .emailVerified(account.getEmailVerified())
        .active(account.getActive())
        .profileId(account.getProfileId())
        .createdAt(account.getCreatedAt())
        .profile(profileSummary)
        .build();
  }

  private AdminAccountProfileSummary toProfileSummary(ProfileResponse profile) {
    return AdminAccountProfileSummary.builder()
        .firstName(profile.getFirstName())
        .lastName(profile.getLastName())
        .phoneNumber(profile.getPhoneNumber())
        .avatarUrl(profile.getAvatarUrl())
        .build();
  }

  private static int normalizePage(Integer page) {
    if (page == null || page < 0) {
      return 0;
    }
    return page;
  }

  private int normalizePageSize(Integer pageSize) {
    if (pageSize == null || pageSize < 1) {
      return defaultPageSize;
    }
    return Math.min(pageSize, 100);
  }
}
