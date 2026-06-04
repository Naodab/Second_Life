package com.naodab.authservice.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.naodab.authservice.dto.event.EmailVerificationEvent;
import com.naodab.authservice.dto.event.ForgotPasswordEvent;
import com.naodab.authservice.clients.ProfileClient;
import com.naodab.authservice.dto.event.CreateProfileEvent;
import com.naodab.authservice.dto.request.ForgotPasswordRequest;
import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.dto.request.RegisterRequest;
import com.naodab.authservice.dto.request.ResetPasswordRequest;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.dto.response.ProfileResponse;
import com.naodab.authservice.kafka.EmailProducerService;
import com.naodab.authservice.kafka.ForgotPasswordProducer;
import com.naodab.authservice.kafka.CreateProfileProducer;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.security.JwtTokenProvider;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.util.PublicUrlHelper;

import java.util.Optional;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
  AccountRepository accountRepository;
  PasswordEncoder passwordEncoder;

  ForgotPasswordProducer forgotPasswordProducer;
  EmailProducerService emailProducerService;
  CreateProfileProducer createProfileProducer;
  JwtTokenProvider jwtTokenProvider;
  ProfileClient profileClient;

  @NonFinal
  @Value("${external.frontend_url}")
  String frontendUrl;

  @NonFinal
  @Value("${external.auth_service_public_base_url}")
  String authServicePublicBaseUrl;

  @NonFinal
  @Value("${external.gateway_url}")
  String gatewayUrl;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    Optional<Account> existing = accountRepository.findByEmail(request.getEmail());
    if (existing.isPresent()) {
      if (existing.get().getAuthProvider() == AuthProvider.GOOGLE) {
        throw new AppException(ErrorCode.EMAIL_REGISTERED_WITH_GOOGLE);
      }
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    Account account = Account.builder()
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .authProvider(AuthProvider.LOCAL)
        .build();

    account = accountRepository.save(account);
    sendCreateProfileEvent(account);
    sendEmailVerification(account);

    return emptyAuthResponse();
  }

  @Transactional
  public AuthResponse login(LoginRequest request) {
    String email = request.getEmail();
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    if (account.getAuthProvider() != AuthProvider.LOCAL) {
      throw new AppException(ErrorCode.SIGN_IN_WITH_GOOGLE);
    }

    if (account.getPassword() == null
        || !passwordEncoder.matches(request.getPassword(), account.getPassword())) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (!Boolean.TRUE.equals(account.getEmailVerified())) {
      sendEmailVerification(account);
      return emptyAuthResponse();
    }

    ProfileResponse profile = profileClient.getProfileById(account.getProfileId())
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));

    String accessToken = generateAccessToken(account);
    String refreshToken = jwtTokenProvider.generateRefreshToken(account.getEmail());

    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .profile(profile)
        .build();
  }

  @Transactional
  public AuthResponse refreshToken(RefreshTokenRequest request) {
    String refreshToken = request.getRefreshToken();

    if (!jwtTokenProvider.validateToken(refreshToken)) {
      throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    String email = jwtTokenProvider.getEmailFromToken(refreshToken);
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    ProfileResponse profile = profileClient.getProfileById(account.getProfileId())
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));

    if (!refreshToken.equals(account.getRefreshToken())) {
      throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    String newAccessToken = generateAccessToken(account);
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

    account.setRefreshToken(newRefreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .profile(profile)
        .build();
  }

  @Transactional
  public AuthResponse verifyEmail(String verificationToken) {
    if (!jwtTokenProvider.validateToken(verificationToken)) {
      throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
    }

    String email = jwtTokenProvider.getEmailFromToken(verificationToken);
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    if (account.getProfileId() == null || account.getProfileId().isBlank()) {
      throw new AppException(ErrorCode.PROFILE_NOT_LINKED_TO_ACCOUNT);
    }

    String accessToken = generateAccessToken(account);
    String refreshToken = jwtTokenProvider.generateRefreshToken(email);

    account.setEmailVerified(true);
    account.setVerificationToken(null);
    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    ProfileResponse profile = profileClient.getProfileById(account.getProfileId())
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));

    return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .profile(profile)
        .build();
  }

  @Transactional
  public void forgotPassword(ForgotPasswordRequest request) {
    Account account = accountRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    String resetPasswordToken = jwtTokenProvider.generateForgotPasswordToken(account.getEmail());
    ForgotPasswordEvent event = ForgotPasswordEvent.builder()
        .toEmail(account.getEmail())
        .resetPasswordToken(resetPasswordToken)
        .resetPasswordLink(buildResetPasswordUrl(resetPasswordToken))
        .username(account.getEmail().split("@")[0])
        .build();
    forgotPasswordProducer.sendForgotPasswordEvent(event);
  }

  @Transactional
  public void resetPassword(String email, ResetPasswordRequest request) {
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.getOldPassword(), account.getPassword())) {
      throw new AppException(ErrorCode.INVALID_OLD_PASSWORD);
    }

    account.setPassword(passwordEncoder.encode(request.getNewPassword()));
    accountRepository.save(account);
  }

  @Transactional
  public void logout(String email) {
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    account.setRefreshToken(null);
    accountRepository.save(account);
  }

  private void sendEmailVerification(Account account) {
    String verificationToken = jwtTokenProvider.generateVerificationToken(account.getEmail());

    account.setVerificationToken(verificationToken);
    accountRepository.save(account);

    EmailVerificationEvent event = EmailVerificationEvent.builder()
        .toEmail(account.getEmail())
        .verificationToken(verificationToken)
        .verificationLink(buildVerificationUrl(verificationToken))
        .username(account.getEmail().split("@")[0])
        .build();

    emailProducerService.sendEmailVerificationEvent(event);
  }

  private void sendCreateProfileEvent(Account account) {
    CreateProfileEvent event = CreateProfileEvent.builder()
        .email(account.getEmail())
        .build();
    createProfileProducer.sendCreateProfileEvent(event);
  }

  private String buildVerificationUrl(String verificationToken) {
    String base = PublicUrlHelper.resolveAuthPublicApiBase(authServicePublicBaseUrl, gatewayUrl);
    return PublicUrlHelper.buildVerifyEmailUrl(base, verificationToken);
  }

  private String buildResetPasswordUrl(String resetPasswordToken) {
    return PublicUrlHelper.stripTrailingSlash(frontendUrl)
        + "/reset-password?token=" + resetPasswordToken;
  }

  private AuthResponse emptyAuthResponse() {
    return AuthResponse.builder().build();
  }

  private String generateAccessToken(Account account) {
    return jwtTokenProvider.generateAccessToken(account.getEmail(), account.getProfileId(), account.getRole());
  }
}
