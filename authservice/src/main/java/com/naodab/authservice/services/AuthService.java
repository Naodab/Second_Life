package com.naodab.authservice.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.naodab.authservice.dto.event.EmailVerificationEvent;
import com.naodab.authservice.dto.event.ForgotPasswordEvent;
import com.naodab.authservice.dto.event.CreateProfileEvent;
import com.naodab.authservice.dto.request.ForgotPasswordRequest;
import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.dto.request.RegisterRequest;
import com.naodab.authservice.dto.request.ResetPasswordRequest;
import com.naodab.authservice.dto.response.AccountInfo;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.kafka.EmailProducerService;
import com.naodab.authservice.kafka.ForgotPasswordProducer;
import com.naodab.authservice.kafka.CreateProfileProducer;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.security.JwtTokenProvider;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

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

  @NonFinal
  @Value("${external.frontend_url}")
  String frontendUrl;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (accountRepository.existsByEmail(request.getEmail())) {
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

    if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (!Boolean.TRUE.equals(account.getEmailVerified())) {
      sendEmailVerification(account);
      return emptyAuthResponse();
    }

    String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail(), account.getProfileId());
    String refreshToken = jwtTokenProvider.generateRefreshToken(account.getEmail());

    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .accountInfo(mapAccountToResponse(account))
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

    if (!refreshToken.equals(account.getRefreshToken())) {
      throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    String newAccessToken = jwtTokenProvider.generateAccessToken(account.getEmail(), account.getProfileId());
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .accountInfo(mapAccountToResponse(account))
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

    String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail(), account.getProfileId());
    String refreshToken = jwtTokenProvider.generateRefreshToken(email);

    account.setEmailVerified(true);
    account.setVerificationToken(null);
    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .accountInfo(mapAccountToResponse(account))
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

  private AccountInfo mapAccountToResponse(Account account) {
    return AccountInfo.builder()
        .email(account.getEmail())
        .role(account.getRole().name())
        .provider(account.getAuthProvider().name())
        .emailVerified(account.getEmailVerified())
        .profileId(account.getProfileId())
        .build();
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
    return frontendUrl + "/api/v1/auth/verify-email?verificationToken=" + verificationToken;
  }

  private String buildResetPasswordUrl(String resetPasswordToken) {
    return frontendUrl + "/api/v1/auth/reset-password?token=" + resetPasswordToken;
  }

  private AuthResponse emptyAuthResponse() {
    return AuthResponse.builder().build();
  }
}
