package com.naodab.authservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import com.naodab.authservice.dto.request.RegisterRequest;
import com.naodab.authservice.dto.response.AuthResponse;
import com.naodab.authservice.dto.request.LoginRequest;
import com.naodab.authservice.dto.request.RefreshTokenRequest;
import com.naodab.authservice.services.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
  AuthService authService;

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
}
