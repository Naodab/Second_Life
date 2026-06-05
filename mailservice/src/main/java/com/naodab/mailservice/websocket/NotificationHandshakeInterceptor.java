package com.naodab.mailservice.websocket;

import java.util.Map;

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

  AuthClients authClients;

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {
    String profileId = resolveProfileId(request);
    if (!StringUtils.hasText(profileId)) {
      return false;
    }
    attributes.put(SESSION_PROFILE_ID, profileId.trim());
    return true;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
    // no-op
  }

  private String resolveProfileId(ServerHttpRequest request) {
    if (request instanceof ServletServerHttpRequest servletRequest) {
      HttpServletRequest httpRequest = servletRequest.getServletRequest();
      String forwardedProfileId = httpRequest.getHeader(AppConstants.HEADER_PROFILE_ID);
      if (StringUtils.hasText(forwardedProfileId)) {
        return forwardedProfileId.trim();
      }
      String token = resolveAccessToken(httpRequest);
      if (StringUtils.hasText(token)) {
        return authClients.resolveProfileId(token).orElse(null);
      }
    }
    return null;
  }

  private static String resolveAccessToken(HttpServletRequest request) {
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
}
