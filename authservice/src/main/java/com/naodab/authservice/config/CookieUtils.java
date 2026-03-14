package com.naodab.authservice.config;

import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

import org.springframework.util.SerializationUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public final class CookieUtils {

  private static final int COOKIE_MAX_AGE_DELETE = 0;

  private CookieUtils() {}

  public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return Optional.empty();
    }
    return Arrays.stream(cookies)
        .filter(cookie -> cookie.getName().equals(name))
        .findFirst();
  }

  @SuppressWarnings("unchecked")
  public static <T> T deserialize(Cookie cookie, Class<T> clazz) {
    byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
    try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(decoded))) {
      return (T) ois.readObject();
    } catch (Exception e) {
      throw new IllegalArgumentException("Failed to deserialize cookie value", e);
    }
  }

  public static String serialize(Object object) {
    return Base64.getUrlEncoder().encodeToString(SerializationUtils.serialize(object));
  }

  public static void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
    Cookie cookie = new Cookie(name, value);
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    cookie.setMaxAge(maxAgeSeconds);
    response.addCookie(cookie);
  }

  public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
    Cookie cookie = new Cookie(name, "");
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    cookie.setMaxAge(COOKIE_MAX_AGE_DELETE);
    response.addCookie(cookie);
  }
}
