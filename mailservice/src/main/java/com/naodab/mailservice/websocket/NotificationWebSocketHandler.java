package com.naodab.mailservice.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.naodab.mailservice.service.NotificationWebSocketSessionRegistry;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationWebSocketHandler extends TextWebSocketHandler {

  NotificationWebSocketSessionRegistry sessionRegistry;

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String profileId = profileId(session);
    if (profileId == null) {
      closeQuietly(session);
      return;
    }
    sessionRegistry.register(profileId, session);
    log.info("Notification websocket connected for profile {}", profileId);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    sessionRegistry.unregister(session);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    // Ping/pong not required for MVP.
  }

  private static String profileId(WebSocketSession session) {
    Object value = session.getAttributes().get(NotificationHandshakeInterceptor.SESSION_PROFILE_ID);
    return value instanceof String s && !s.isBlank() ? s.trim() : null;
  }

  private static void closeQuietly(WebSocketSession session) {
    try {
      session.close(CloseStatus.NOT_ACCEPTABLE);
    } catch (Exception ignored) {
      // ignore
    }
  }
}
