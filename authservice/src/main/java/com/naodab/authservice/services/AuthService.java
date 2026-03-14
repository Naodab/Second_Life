package com.naodab.authservice.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.dto.request.RegisterRequest;
import com.naodab.authservice.dto.response.AccountInfo;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.security.JwtTokenProvider;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
  AccountRepository accountRepository;
  PasswordEncoder passwordEncoder;
  JwtTokenProvider jwtTokenProvider;
  AuthenticationManager authenticationManager;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (accountRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Email already exists");
    }

    Account account = Account.builder()
      .email(request.getEmail())
      .password(passwordEncoder.encode(request.getPassword()))
      .authProvider(AuthProvider.LOCAL)
      .build();

    account = accountRepository.save(account);

    String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail());
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
  public AuthResponse login(LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
    );

    String email = authentication.getName();
    Account account = accountRepository.findByEmail(email)
      .orElseThrow(() -> new RuntimeException("Account not found"));

    String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail());
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
      throw new RuntimeException("Invalid refresh token");
    }

    String email = jwtTokenProvider.getEmailFromToken(refreshToken);
    Account account = accountRepository.findByEmail(email)
      .orElseThrow(() -> new RuntimeException("Account not found"));

    if (!refreshToken.equals(account.getRefreshToken())) {
      throw new RuntimeException("Invalid refresh token");
    }

    String newAccessToken = jwtTokenProvider.generateAccessToken(email);
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return AuthResponse.builder()
      .accessToken(newAccessToken)
      .refreshToken(newRefreshToken)
      .accountInfo(mapAccountToResponse(account))
      .build();
  }

  private AccountInfo mapAccountToResponse(Account account) {
    return AccountInfo.builder()
      .email(account.getEmail())
      .role(account.getRole().name())
      .provider(account.getAuthProvider().name())
      .emailVerified(account.getEmailVerified())
      .build();
  }
}
