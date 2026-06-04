package com.naodab.authservice.controllers;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.properties.ProtectedPathsProperties;
import com.naodab.authservice.security.JwtTokenProvider;
import com.naodab.commonservice.constant.AppConstants;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.FieldDefaults;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ForwardAuthController {
  JwtTokenProvider jwtTokenProvider;
  ProtectedPathsProperties protectedPathsProperties;

  private static final Set<String> EXACT_PATH_PREFIXES = Set.of("/api/v1/listings");

  private static final String HEADER_FORWARDED_METHOD = "X-Forwarded-Method";

  private static final String HEADER_FORWARDED_URI = "X-Forwarded-Uri";

  @RequestMapping("/auth/forward-auth")
  public ResponseEntity<Void> forwardAuth(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @RequestHeader(value = HEADER_FORWARDED_METHOD, required = false) String forwardedMethod,
      @RequestHeader(value = HEADER_FORWARDED_URI, required = false) String forwardedUri,
      @RequestParam(value = "method", required = false) String methodParam) {

    String method = firstNonBlank(forwardedMethod, methodParam);
    String path = normalizeRequestPath(forwardedUri);

    if (requiresProtection(method, path)) {
      return requireAuthenticatedAndForward(authorization);
    }
    return optionallyForwardAuthHeaders(authorization);
  }

  private boolean requiresProtection(String method, String path) {
    Map<String, List<String>> protectedPaths = protectedPathsProperties.getByMethod();
    if (protectedPaths.isEmpty()) {
      return false;
    }
    if (!StringUtils.hasText(method) || !StringUtils.hasText(path)) {
      return true;
    }
    String key = method.trim().toUpperCase(Locale.ROOT);
    List<String> prefixes = protectedPaths.get(key);
    if (prefixes == null || prefixes.isEmpty()) {
      return false;
    }
    for (String prefix : prefixes) {
      if (!StringUtils.hasText(prefix)) {
        continue;
      }
      if (pathMatches(path, prefix.trim())) {
        return true;
      }
    }
    return false;
  }

  private static boolean pathMatches(String path, String prefix) {
    if (EXACT_PATH_PREFIXES.contains(prefix)) {
      return path.equals(prefix);
    }
    return path.equals(prefix) || path.startsWith(prefix + "/");
  }

  private static String firstNonBlank(String a, String b) {
    if (StringUtils.hasText(a)) {
      return a.trim();
    }
    if (StringUtils.hasText(b)) {
      return b.trim();
    }
    return null;
  }

  private static String normalizeRequestPath(String forwardedUri) {
    if (!StringUtils.hasText(forwardedUri)) {
      return null;
    }
    String raw = forwardedUri.trim();
    int q = raw.indexOf('?');
    if (q >= 0) {
      raw = raw.substring(0, q);
    }
    int hash = raw.indexOf('#');
    if (hash >= 0) {
      raw = raw.substring(0, hash);
    }
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        URI uri = URI.create(raw);
        String p = uri.getPath();
        return StringUtils.hasText(p) ? p : "/";
      } catch (IllegalArgumentException ignored) {
        return raw.startsWith("/") ? raw : "/" + raw;
      }
    }
    return raw.startsWith("/") ? raw : "/" + raw;
  }

  private ResponseEntity<Void> requireAuthenticatedAndForward(String authorization) {
    String jwt = extractBearer(authorization);
    log.debug("Forward auth (protected) bearer present: {}, valid: {}", StringUtils.hasText(jwt),
        jwt != null && jwtTokenProvider.validateToken(jwt));
    if (!StringUtils.hasText(jwt) || !jwtTokenProvider.validateToken(jwt)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return applyJwtClaimsToResponse(jwt, true);
  }

  private ResponseEntity<Void> optionallyForwardAuthHeaders(String authorization) {
    String jwt = extractBearer(authorization);
    if (!StringUtils.hasText(jwt)) {
      return noUserContextToForward();
    }
    if (!jwtTokenProvider.validateToken(jwt)) {
      return noUserContextToForward();
    }
    return applyJwtClaimsToResponse(jwt, false);
  }

  private ResponseEntity<Void> applyJwtClaimsToResponse(String jwt, boolean strict) {
    try {
      String subject = jwtTokenProvider.getEmailFromToken(jwt);
      if (!StringUtils.hasText(subject)) {
        if (strict) {
          return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return noUserContextToForward();
      }

      var response = ResponseEntity.status(HttpStatus.OK)
          .header(AppConstants.HEADER_USER_EMAIL, subject);

      String profileId = jwtTokenProvider.getProfileIdFromToken(jwt);
      if (StringUtils.hasText(profileId)) {
        response = response.header(AppConstants.HEADER_PROFILE_ID, profileId);
      }

      String role = jwtTokenProvider.getRoleFromToken(jwt);
      if (StringUtils.hasText(role)) {
        response = response.header(AppConstants.JWT_CLAIM_ROLE, role);
      } else {
        response = response.header(AppConstants.JWT_CLAIM_ROLE, Role.USER.name());
      }

      return response.build();
    } catch (Exception e) {
      log.error("Forward auth failed while reading token claims: {}", e.getMessage());
      if (strict) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      }
      return noUserContextToForward();
    }
  }

  private static ResponseEntity<Void> noUserContextToForward() {
    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }

  private static String extractBearer(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return null;
    }
    return authorization.substring(7);
  }
}
