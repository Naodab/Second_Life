package com.naodab.authservice.config;

import java.util.Arrays;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public final class CookieUtils {

  private CookieUtils() {
  }

  public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return Optional.empty();
    }
    return Arrays.stream(cookies)
        .filter(cookie -> cookie.getName().equals(name))
        .findFirst();
  }

  public static void addCookie(
      HttpServletResponse response,
      HttpServletRequest request,
      String name,
      String value,
      int maxAgeSeconds) {
    ResponseCookie cookie = ResponseCookie.from(name, value)
        .path("/")
        .httpOnly(true)
        .secure(request.isSecure())
        .sameSite("Lax")
        .maxAge(maxAgeSeconds)
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  public static void deleteCookie(HttpServletResponse response, HttpServletRequest request, String name) {
    ResponseCookie cookie = ResponseCookie.from(name, "")
        .path("/")
        .httpOnly(true)
        .secure(request.isSecure())
        .sameSite("Lax")
        .maxAge(0)
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
