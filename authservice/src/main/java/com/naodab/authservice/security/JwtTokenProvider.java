package com.naodab.authservice.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.constant.AppConstants;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class JwtTokenProvider {

  @Value("${app.jwt.secret}")
  String jwtSecret;

  @Value("${app.jwt.expiration}")
  Long jwtExpirationInMs;

  @Value("${app.jwt.refresh-expiration}")
  Long jwtRefreshExpirationInMs;

  @Value("${app.verification-token-expiration}")
  Long verificationTokenExpirationInMs;

  @Value("${app.forgot-password-token-expiration}")
  Long forgotPasswordTokenExpirationInMs;

  private SecretKey getSecretKey() {
    byte[] keyBytes = jwtSecret.getBytes();
    return Keys.hmacShaKeyFor(keyBytes);
  }

  public String generateAccessToken(String email, String profileId) {
    var builder = Jwts.builder()
        .subject(email)
        .signWith(getSecretKey())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs));
    if (StringUtils.hasText(profileId)) {
      builder.claim(AppConstants.JWT_CLAIM_PROFILE_ID, profileId);
    }
    return builder.compact();
  }

  public String generateVerificationToken(String email) {
    return Jwts.builder()
        .subject(email)
        .signWith(getSecretKey())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + verificationTokenExpirationInMs))
        .compact();
  }

  public String generateRefreshToken(String email) {
    return Jwts.builder()
        .subject(email)
        .signWith(getSecretKey())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtRefreshExpirationInMs))
        .compact();
  }

  public String generateForgotPasswordToken(String email) {
    return Jwts.builder()
        .subject(email)
        .signWith(getSecretKey())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + forgotPasswordTokenExpirationInMs))
        .compact();
  }

  public String getEmailFromToken(String token) {
    return Jwts.parser()
        .verifyWith(getSecretKey())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getSubject();
  }

  public String getProfileIdFromToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(getSecretKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return claims.get(AppConstants.JWT_CLAIM_PROFILE_ID, String.class);
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parser()
          .verifyWith(getSecretKey())
          .build()
          .parseSignedClaims(token);
      return true;
    } catch (MalformedJwtException e) {
      log.error("Invalid JWT token: {}", e.getMessage());
    } catch (ExpiredJwtException e) {
      log.error("JWT token is expired: {}", e.getMessage());
    } catch (UnsupportedJwtException e) {
      log.error("JWT token is unsupported: {}", e.getMessage());
    } catch (IllegalArgumentException e) {
      log.error("JWT claims string is empty: {}", e.getMessage());
    } catch (Exception e) {
      log.error("JWT validation failed (key/config or parse): {}", e.getMessage());
    }

    return false;
  }
}
