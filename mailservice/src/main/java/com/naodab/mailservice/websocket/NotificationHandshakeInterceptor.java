package com.naodab.mailservice.websocket;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.constant.OrderNotificationConstants;
import com.naodab.mailservice.clients.AuthClients;
import com.naodab.mailservice.clients.AuthForwardContext;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationHandshakeInterceptor implements HandshakeInterceptor {

  public static final String SESSION_PROFILE_ID = "profileId";
  public static final String SESSION_ROLE = "role";

  AuthClients authClients;

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {
    Optional<AuthForwardContext> auth = resolveAuthContext(request);
    if (auth.isEmpty() || !StringUtils.hasText(auth.get().profileId())) {
      return false;
    }
    attributes.put(SESSION_PROFILE_ID, auth.get().profileId().trim());
    if (StringUtils.hasText(auth.get().role())) {
      attributes.put(SESSION_ROLE, auth.get().role().trim());
    }
    return true;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
  }

  private Optional<AuthForwardContext> resolveAuthContext(ServerHttpRequest request) {
    if (!(request instanceof ServletServerHttpRequest servletRequest)) {
      return Optional.empty();
    }
    HttpServletRequest httpRequest = servletRequest.getServletRequest();

    String profileId = trimToNull(httpRequest.getHeader(AppConstants.HEADER_PROFILE_ID));
    String role = trimToNull(httpRequest.getHeader(AppConstants.JWT_CLAIM_ROLE));

    if (!StringUtils.hasText(profileId)) {
      String token = resolveAccessToken(httpRequest);
      if (!StringUtils.hasText(token)) {
        return Optional.empty();
      }
      return authClients.resolveAuthContext(token);
    }

    if (!StringUtils.hasText(role)) {
      String token = resolveAccessToken(httpRequest);
      if (StringUtils.hasText(token)) {
        role = authClients.resolveAuthContext(token)
            .map(AuthForwardContext::role)
            .filter(StringUtils::hasText)
            .orElse(null);
      }
    }

    return Optional.of(new AuthForwardContext(profileId, role));
  }

  private static String resolveAccessToken(HttpServletRequest request) {
    String queryToken = request.getParameter("access_token");
    if (StringUtils.hasText(queryToken)) {
      return queryToken.trim();
    }
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    for (Cookie cookie : cookies) {
      if (OrderNotificationConstants.ACCESS_TOKEN_COOKIE.equals(cookie.getName())
          && StringUtils.hasText(cookie.getValue())) {
        return cookie.getValue().trim();
      }
    }
    return null;
  }

  private static String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }
}
