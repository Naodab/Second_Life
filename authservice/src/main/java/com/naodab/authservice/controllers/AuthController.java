package com.naodab.authservice.controllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.authservice.dto.request.RegisterRequest;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.dto.request.ForgotPasswordRequest;
import com.naodab.authservice.dto.request.ResetPasswordRequest;
import com.naodab.authservice.services.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
  AuthService authService;

  @NonFinal
  @Value("${external.frontend_url}")
  String frontendUrl;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authService.register(request));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/refresh-token")
  public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
    return ResponseEntity.ok(authService.refreshToken(request));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetails userDetails) {
    authService.logout(userDetails.getUsername());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/verify-email")
  public ResponseEntity<Void> verifyEmail(@RequestParam String verificationToken) {
    AuthResponse auth = authService.verifyEmail(verificationToken);
    String redirect = UriComponentsBuilder.fromUriString(frontendUrl)
        .path("/email-verified")
        .queryParam("token", auth.getAccessToken())
        .queryParam("refresh_token", auth.getRefreshToken())
        .encode()
        .build()
        .toUriString();
    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirect)).build();
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Void> resetPassword(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(userDetails.getUsername(), request);
    return ResponseEntity.noContent().build();
  }
}
