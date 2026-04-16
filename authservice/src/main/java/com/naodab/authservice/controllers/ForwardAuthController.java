package com.naodab.authservice.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.authservice.security.JwtTokenProvider;
import com.naodab.commonservice.constant.AppConstants;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ForwardAuthController {

  public static final String HEADER_USER_SUB = "X-User-Sub";

  private final JwtTokenProvider jwtTokenProvider;

  @RequestMapping("/auth/forward-auth")
  public ResponseEntity<Void> forwardAuth(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {

    String jwt = extractBearer(authorization);
    log.debug("Forward auth request, bearer token present: {}", StringUtils.hasText(jwt));
    log.debug("Forward auth request, bearer token: {}", jwtTokenProvider.validateToken(jwt));
    if (!StringUtils.hasText(jwt) || !jwtTokenProvider.validateToken(jwt)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    try {
      String subject = jwtTokenProvider.getEmailFromToken(jwt);
      log.debug("Forward auth request, subject present: {}", StringUtils.hasText(subject));
      if (!StringUtils.hasText(subject)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      }

      var response = ResponseEntity.ok()
          .header(AppConstants.HEADER_USER_EMAIL, subject);

      String profileId = jwtTokenProvider.getProfileIdFromToken(jwt);
      if (StringUtils.hasText(profileId)) {
        response = response.header(AppConstants.HEADER_PROFILE_ID, profileId);
      }

      return response.build();
    } catch (Exception e) {
      log.error("Forward auth failed while reading token claims: {}", e.getMessage());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
  }

  private static String extractBearer(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return null;
    }
    return authorization.substring(7);
  }
}
