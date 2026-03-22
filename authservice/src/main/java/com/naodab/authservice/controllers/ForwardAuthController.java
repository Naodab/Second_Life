package com.naodab.authservice.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.authservice.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ForwardAuthController {

  public static final String HEADER_USER_EMAIL = "X-User-Email";
  public static final String HEADER_USER_SUB = "X-User-Sub";

  private final JwtTokenProvider jwtTokenProvider;

  @RequestMapping("/api/v1/auth/forward-auth")
  public ResponseEntity<Void> forwardAuth(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {

    String jwt = extractBearer(authorization);
    if (!StringUtils.hasText(jwt) || !jwtTokenProvider.validateToken(jwt)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String subject = jwtTokenProvider.getEmailFromToken(jwt);
    if (!StringUtils.hasText(subject)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    return ResponseEntity.ok()
        .header(HEADER_USER_EMAIL, subject)
        .header(HEADER_USER_SUB, subject)
        .build();
  }

  private static String extractBearer(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return null;
    }
    return authorization.substring(7);
  }
}
