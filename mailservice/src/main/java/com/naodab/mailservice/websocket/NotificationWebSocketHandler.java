package com.naodab.mailservice.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.mailservice.service.NotificationWebSocketSessionRegistry;
import com.naodab.mailservice.support.ConversationConstants;

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
    if (AppConstants.ROLE_ADMIN.equals(role(session))) {
      sessionRegistry.register(ConversationConstants.ADMIN_INBOX_PROFILE_ID, session);
    }
    log.info("Notification websocket connected for profile {}", profileId);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    sessionRegistry.unregister(session);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    // Push-only channel; clients do not send commands.
  }

  private static String profileId(WebSocketSession session) {
    Object value = session.getAttributes().get(NotificationHandshakeInterceptor.SESSION_PROFILE_ID);
    return value instanceof String s && !s.isBlank() ? s.trim() : null;
  }

  private static String role(WebSocketSession session) {
    Object value = session.getAttributes().get(NotificationHandshakeInterceptor.SESSION_ROLE);
    return value instanceof String s && !s.isBlank() ? s.trim() : null;
  }

  private static void closeQuietly(WebSocketSession session) {
    try {
      session.close(CloseStatus.NOT_ACCEPTABLE);
    } catch (Exception ignored) {
      // Best-effort close when handshake attributes are invalid.
    }
  }
}
