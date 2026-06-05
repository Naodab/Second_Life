package com.naodab.mailservice.service;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.mailservice.dto.NotificationResponse;
import com.naodab.mailservice.dto.OrderNotificationEvent;
import com.naodab.mailservice.models.NotificationDocument;
import com.naodab.mailservice.repositories.NotificationRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

  private static final int DEFAULT_LIMIT = 50;

  NotificationRepository notificationRepository;
  NotificationMessageFactory notificationMessageFactory;
  NotificationWebSocketSessionRegistry sessionRegistry;
  ObjectMapper objectMapper;
  OrderNotificationEmailService orderNotificationEmailService;

  public NotificationDocument createFromOrderEvent(OrderNotificationEvent event) {
    if (event == null || !StringUtils.hasText(event.getRecipientProfileId())) {
      return null;
    }
    NotificationDocument document = notificationMessageFactory.buildDocument(event);
    NotificationDocument saved = notificationRepository.save(document);
    pushRealtime(saved);
    orderNotificationEmailService.sendOrderNotification(event, saved);
    return saved;
  }

  public List<NotificationResponse> listForProfile(String profileId, Integer limit) {
    String normalizedProfileId = requireProfileId(profileId);
    int pageSize = limit != null && limit > 0 ? Math.min(limit, 100) : DEFAULT_LIMIT;
    return notificationRepository
        .findByProfileIdOrderByCreatedAtDesc(normalizedProfileId, PageRequest.of(0, pageSize))
        .stream()
        .map(this::toResponse)
        .toList();
  }

  public long countUnread(String profileId) {
    return notificationRepository.countByProfileIdAndReadFalse(requireProfileId(profileId));
  }

  public NotificationResponse markRead(String profileId, String notificationId) {
    NotificationDocument document = notificationRepository
        .findByIdAndProfileId(notificationId.trim(), requireProfileId(profileId))
        .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
    if (!document.isRead()) {
      document.setRead(true);
      document = notificationRepository.save(document);
    }
    return toResponse(document);
  }

  public void markAllRead(String profileId) {
    String normalizedProfileId = requireProfileId(profileId);
    List<NotificationDocument> unread =
        notificationRepository.findByProfileIdAndReadFalse(normalizedProfileId);
    if (unread.isEmpty()) {
      return;
    }
    unread.forEach(doc -> doc.setRead(true));
    notificationRepository.saveAll(unread);
  }

  private void pushRealtime(NotificationDocument document) {
    Set<WebSocketSession> sessions = sessionRegistry.sessionsFor(document.getProfileId());
    if (sessions.isEmpty()) {
      return;
    }
    try {
      String payload = objectMapper.writeValueAsString(
          java.util.Map.of("type", "NOTIFICATION", "notification", toResponse(document)));
      TextMessage message = new TextMessage(payload);
      for (WebSocketSession session : sessions) {
        if (session.isOpen()) {
          session.sendMessage(message);
        }
      }
    } catch (JsonProcessingException ex) {
      log.warn("Failed to serialize websocket notification payload: {}", ex.getMessage());
    } catch (Exception ex) {
      log.warn("Failed to push websocket notification: {}", ex.getMessage());
    }
  }

  private NotificationResponse toResponse(NotificationDocument document) {
    return NotificationResponse.builder()
        .id(document.getId())
        .type(document.getType())
        .title(document.getTitle())
        .body(document.getBody())
        .link(document.getLink())
        .read(document.isRead())
        .createdAt(document.getCreatedAt())
        .orderId(document.getOrderId())
        .orderType(document.getOrderType())
        .build();
  }

  private static String requireProfileId(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    return profileId.trim();
  }
}
