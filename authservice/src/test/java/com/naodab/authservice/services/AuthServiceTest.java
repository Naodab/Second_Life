package com.naodab.authservice.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.naodab.authservice.clients.ProfileClient;
import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.authservice.kafka.CreateProfileProducer;
import com.naodab.authservice.kafka.EmailProducerService;
import com.naodab.authservice.kafka.ForgotPasswordProducer;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.security.JwtTokenProvider;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock
  AccountRepository accountRepository;

  @Mock
  PasswordEncoder passwordEncoder;

  @Mock
  ForgotPasswordProducer forgotPasswordProducer;

  @Mock
  EmailProducerService emailProducerService;

  @Mock
  CreateProfileProducer createProfileProducer;

  @Mock
  JwtTokenProvider jwtTokenProvider;

  @Mock
  ProfileClient profileClient;

  @InjectMocks
  AuthService authService;

  @BeforeEach
  void setUp() {
    org.springframework.test.util.ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost");
    org.springframework.test.util.ReflectionTestUtils.setField(authService, "authServicePublicBaseUrl", "http://localhost");
    org.springframework.test.util.ReflectionTestUtils.setField(authService, "gatewayUrl", "http://localhost");
  }

  @Test
  void login_skipsProfileFetchForAdminWithoutProfileId() {
    Account admin = Account.builder()
        .email("admin@example.com")
        .password("encoded")
        .role(Role.ADMIN)
        .authProvider(AuthProvider.LOCAL)
        .emailVerified(true)
        .profileId(null)
        .build();

    when(accountRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);
    when(jwtTokenProvider.generateAccessToken("admin@example.com", null, Role.ADMIN)).thenReturn("access-token");
    when(jwtTokenProvider.generateRefreshToken("admin@example.com")).thenReturn("refresh-token");
    when(accountRepository.save(admin)).thenReturn(admin);

    AuthResponse response = authService.login(LoginRequest.builder()
        .email("admin@example.com")
        .password("secret")
        .build());

    verify(profileClient, never()).getProfileById(any());
    assertThat(response.getAccessToken()).isEqualTo("access-token");
    assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
    assertThat(response.getProfile()).isNull();
  }

  @Test
  void login_fetchesProfileForRegularUser() {
    Account user = Account.builder()
        .email("user@example.com")
        .password("encoded")
        .role(Role.USER)
        .authProvider(AuthProvider.LOCAL)
        .emailVerified(true)
        .profileId("profile-1")
        .build();
    ProfileResponse profile = ProfileResponse.builder()
        .id("profile-1")
        .email("user@example.com")
        .firstName("An")
        .build();

    when(accountRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);
    when(profileClient.getProfileById("profile-1")).thenReturn(Optional.of(profile));
    when(jwtTokenProvider.generateAccessToken("user@example.com", "profile-1", Role.USER)).thenReturn("access-token");
    when(jwtTokenProvider.generateRefreshToken("user@example.com")).thenReturn("refresh-token");
    when(accountRepository.save(user)).thenReturn(user);

    AuthResponse response = authService.login(LoginRequest.builder()
        .email("user@example.com")
        .password("secret")
        .build());

    verify(profileClient).getProfileById("profile-1");
    assertThat(response.getProfile()).isEqualTo(profile);
  }

  @Test
  void login_throwsWhenRegularUserHasNoProfileId() {
    Account user = Account.builder()
        .email("user@example.com")
        .password("encoded")
        .role(Role.USER)
        .authProvider(AuthProvider.LOCAL)
        .emailVerified(true)
        .profileId(null)
        .build();

    when(accountRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);

    assertThatThrownBy(() -> authService.login(LoginRequest.builder()
        .email("user@example.com")
        .password("secret")
        .build()))
        .isInstanceOf(AppException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.PROFILE_NOT_FOUND);

    verify(profileClient, never()).getProfileById(any());
  }

  @Test
  void refreshToken_skipsProfileFetchForAdmin() {
    Account admin = Account.builder()
        .email("admin@example.com")
        .role(Role.ADMIN)
        .profileId(null)
        .refreshToken("refresh-token")
        .build();

    when(jwtTokenProvider.validateToken("refresh-token")).thenReturn(true);
    when(jwtTokenProvider.getEmailFromToken("refresh-token")).thenReturn("admin@example.com");
    when(accountRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
    when(jwtTokenProvider.generateAccessToken("admin@example.com", null, Role.ADMIN)).thenReturn("new-access");
    when(jwtTokenProvider.generateRefreshToken("admin@example.com")).thenReturn("new-refresh");
    when(accountRepository.save(admin)).thenReturn(admin);

    AuthResponse response = authService.refreshToken(RefreshTokenRequest.builder()
        .refreshToken("refresh-token")
        .build());

    verify(profileClient, never()).getProfileById(any());
    assertThat(response.getProfile()).isNull();
    assertThat(response.getAccessToken()).isEqualTo("new-access");
  }

  @Test
  void refreshToken_fetchesProfileForRegularUser() {
    Account user = Account.builder()
        .email("user@example.com")
        .role(Role.USER)
        .profileId("profile-1")
        .refreshToken("refresh-token")
        .build();
    ProfileResponse profile = ProfileResponse.builder()
        .id("profile-1")
        .email("user@example.com")
        .firstName("An")
        .build();

    when(jwtTokenProvider.validateToken("refresh-token")).thenReturn(true);
    when(jwtTokenProvider.getEmailFromToken("refresh-token")).thenReturn("user@example.com");
    when(accountRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
    when(profileClient.getProfileById("profile-1")).thenReturn(Optional.of(profile));
    when(jwtTokenProvider.generateAccessToken("user@example.com", "profile-1", Role.USER)).thenReturn("new-access");
    when(jwtTokenProvider.generateRefreshToken("user@example.com")).thenReturn("new-refresh");
    when(accountRepository.save(user)).thenReturn(user);

    AuthResponse response = authService.refreshToken(RefreshTokenRequest.builder()
        .refreshToken("refresh-token")
        .build());

    verify(profileClient).getProfileById(eq("profile-1"));
    assertThat(response.getProfile()).isEqualTo(profile);
  }
}
