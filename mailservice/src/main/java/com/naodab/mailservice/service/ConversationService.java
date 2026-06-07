package com.naodab.mailservice.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
import com.naodab.mailservice.clients.ProductClients;
import com.naodab.mailservice.dto.ConversationResponse;
import com.naodab.mailservice.dto.CreateAdminConversationRequest;
import com.naodab.mailservice.dto.CreateConversationRequest;
import com.naodab.mailservice.dto.FacilitySummary;
import com.naodab.mailservice.dto.MessageResponse;
import com.naodab.mailservice.dto.SendMessageRequest;
import com.naodab.mailservice.models.ConversationDocument;
import com.naodab.mailservice.models.ConversationType;
import com.naodab.mailservice.models.MessageDocument;
import com.naodab.mailservice.repositories.ConversationRepository;
import com.naodab.mailservice.repositories.MessageRepository;
import com.naodab.mailservice.support.ConversationConstants;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {

  private static final int DEFAULT_LIMIT = 50;

  ConversationRepository conversationRepository;
  MessageRepository messageRepository;
  ProductClients productClients;
  NotificationWebSocketSessionRegistry sessionRegistry;
  ObjectMapper objectMapper;

  public List<ConversationResponse> listAsBuyer(String profileId, Integer limit) {
    String normalizedProfileId = requireProfileId(profileId);
    int pageSize = normalizeLimit(limit);
    return conversationRepository
        .findByBuyerProfileIdAndConversationTypeNotOrderByLastMessageAtDesc(
            normalizedProfileId, ConversationType.ADMIN, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, normalizedProfileId, false))
        .toList();
  }

  public List<ConversationResponse> listAsSeller(String profileId, Integer limit) {
    String normalizedProfileId = requireProfileId(profileId);
    int pageSize = normalizeLimit(limit);
    return conversationRepository
        .findBySellerProfileIdAndConversationTypeNotOrderByLastMessageAtDesc(
            normalizedProfileId, ConversationType.ADMIN, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, normalizedProfileId, false))
        .toList();
  }

  public List<ConversationResponse> listAdminSupportAsUser(String profileId, Integer limit) {
    String normalizedProfileId = requireProfileId(profileId);
    int pageSize = normalizeLimit(limit);
    return conversationRepository
        .findByBuyerProfileIdAndConversationTypeOrderByLastMessageAtDesc(
            normalizedProfileId, ConversationType.ADMIN, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, normalizedProfileId, false))
        .toList();
  }

  public List<ConversationResponse> listAdminSupportInbox(Integer limit) {
    int pageSize = normalizeLimit(limit);
    return conversationRepository
        .findByConversationTypeOrderByLastMessageAtDesc(ConversationType.ADMIN, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, ConversationConstants.ADMIN_INBOX_PROFILE_ID, true))
        .toList();
  }

  public ConversationResponse getOrCreateAdminSupport(String profileId, CreateAdminConversationRequest request) {
    String buyerProfileId = requireProfileId(profileId);

    ConversationDocument conversation = conversationRepository
        .findByBuyerProfileIdAndFacilityId(buyerProfileId, ConversationConstants.ADMIN_SUPPORT_FACILITY_ID)
        .orElseGet(() -> createAdminSupportConversation(buyerProfileId));

    if (request != null && MessagePayloadSupport.hasPayload(request)) {
      persistMessage(conversation, buyerProfileId, request);
    }

    return toResponse(conversation, buyerProfileId, false);
  }

  public ConversationResponse getOrCreate(String profileId, CreateConversationRequest request) {
    String buyerProfileId = requireProfileId(profileId);
    String facilityId = requireText(request.getFacilityId(), ErrorCode.INVALID_INPUT);

    ConversationDocument conversation = conversationRepository
        .findByBuyerProfileIdAndFacilityId(buyerProfileId, facilityId)
        .orElseGet(() -> createConversationDocument(buyerProfileId, facilityId));

    if (MessagePayloadSupport.hasPayload(request)) {
      persistMessage(conversation, buyerProfileId, request);
    }

    return toResponse(conversation, buyerProfileId, false);
  }

  public List<MessageResponse> listMessages(String profileId, String conversationId, Integer limit, boolean adminRole) {
    requireAccessibleConversation(profileId, conversationId, adminRole);
    int pageSize = normalizeLimit(limit);
    List<MessageDocument> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
        conversationId.trim(), PageRequest.of(0, pageSize));
    return messages.stream()
        .sorted(Comparator.comparing(MessageDocument::getCreatedAt))
        .map(this::toMessageResponse)
        .toList();
  }

  public MessageResponse sendMessage(
      String profileId,
      String conversationId,
      SendMessageRequest request,
      boolean adminRole) {
    ConversationDocument conversation = requireAccessibleConversation(profileId, conversationId, adminRole);
    return persistMessage(conversation, requireProfileId(profileId), request);
  }

  public ConversationResponse markRead(String profileId, String conversationId, boolean adminRole) {
    ConversationDocument conversation = requireAccessibleConversation(profileId, conversationId, adminRole);
    String normalizedProfileId = requireProfileId(profileId);
    if (normalizedProfileId.equals(conversation.getBuyerProfileId())) {
      conversation.setUnreadByBuyer(0);
    } else if (isAdminSideViewer(conversation, normalizedProfileId, adminRole)) {
      conversation.setUnreadBySeller(0);
    } else if (normalizedProfileId.equals(conversation.getSellerProfileId())) {
      conversation.setUnreadBySeller(0);
    }
    ConversationDocument saved = conversationRepository.save(conversation);
    return toResponse(saved, normalizedProfileId, adminRole);
  }

  private MessageResponse persistMessage(
      ConversationDocument conversation,
      String senderProfileId,
      com.naodab.mailservice.dto.MessagePayload payload) {
    MessageDocument message = messageRepository.save(
        MessagePayloadSupport.buildDocument(conversation.getId(), senderProfileId, payload));

    Instant now = message.getCreatedAt();
    conversation.setLastMessagePreview(MessagePayloadSupport.buildPreview(message));
    conversation.setLastMessageAt(now);
    conversation.setUpdatedAt(now);
    if (senderProfileId.equals(conversation.getBuyerProfileId())) {
      conversation.setUnreadBySeller(conversation.getUnreadBySeller() + 1);
    } else {
      conversation.setUnreadByBuyer(conversation.getUnreadByBuyer() + 1);
    }
    ConversationDocument savedConversation = conversationRepository.save(conversation);

    MessageResponse messageResponse = toMessageResponse(message);
    pushRealtime(savedConversation, messageResponse);
    return messageResponse;
  }

  private ConversationDocument createAdminSupportConversation(String buyerProfileId) {
    Instant now = Instant.now();
    return conversationRepository.save(ConversationDocument.builder()
        .conversationType(ConversationType.ADMIN)
        .buyerProfileId(buyerProfileId)
        .sellerProfileId(ConversationConstants.ADMIN_INBOX_PROFILE_ID)
        .facilityId(ConversationConstants.ADMIN_SUPPORT_FACILITY_ID)
        .facilityName(ConversationConstants.ADMIN_SUPPORT_FACILITY_NAME)
        .lastMessageAt(now)
        .createdAt(now)
        .updatedAt(now)
        .build());
  }

  private ConversationDocument createConversationDocument(String buyerProfileId, String facilityId) {
    FacilitySummary facility = productClients.getFacility(buyerProfileId, facilityId);
    if (!StringUtils.hasText(facility.getOwnerId())) {
      throw new AppException(ErrorCode.FACILITY_NOT_FOUND);
    }
    if (buyerProfileId.equals(facility.getOwnerId().trim())) {
      throw new AppException(ErrorCode.CANNOT_MESSAGE_OWN_FACILITY);
    }

    Instant now = Instant.now();
    return conversationRepository.save(ConversationDocument.builder()
        .conversationType(ConversationType.FACILITY)
        .buyerProfileId(buyerProfileId)
        .sellerProfileId(facility.getOwnerId().trim())
        .facilityId(facilityId.trim())
        .facilityName(facility.getName())
        .facilityImageUrl(StringUtils.hasText(facility.getImageUrl()) ? facility.getImageUrl().trim() : null)
        .lastMessageAt(now)
        .createdAt(now)
        .updatedAt(now)
        .build());
  }

  private ConversationDocument requireAccessibleConversation(
      String profileId,
      String conversationId,
      boolean adminRole) {
    String normalizedProfileId = requireProfileId(profileId);
    String normalizedConversationId = requireText(conversationId, ErrorCode.INVALID_INPUT);
    return conversationRepository.findById(normalizedConversationId)
        .filter(doc -> canAccessConversation(doc, normalizedProfileId, adminRole))
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
  }

  private static boolean canAccessConversation(
      ConversationDocument document,
      String profileId,
      boolean adminRole) {
    if (profileId.equals(document.getBuyerProfileId())
        || profileId.equals(document.getSellerProfileId())) {
      return true;
    }
    return adminRole && document.getConversationType() == ConversationType.ADMIN;
  }

  private static boolean isAdminSideViewer(
      ConversationDocument document,
      String profileId,
      boolean adminRole) {
    return adminRole
        && document.getConversationType() == ConversationType.ADMIN
        && ConversationConstants.ADMIN_INBOX_PROFILE_ID.equals(document.getSellerProfileId());
  }

  private void pushRealtime(ConversationDocument conversation, MessageResponse message) {
    String recipientProfileId = message.getSenderProfileId().equals(conversation.getBuyerProfileId())
        ? conversation.getSellerProfileId()
        : conversation.getBuyerProfileId();
    Set<WebSocketSession> sessions = ConversationConstants.ADMIN_INBOX_PROFILE_ID.equals(recipientProfileId)
        ? sessionRegistry.sessionsFor(ConversationConstants.ADMIN_INBOX_PROFILE_ID)
        : sessionRegistry.sessionsFor(recipientProfileId);
    if (sessions.isEmpty()) {
      return;
    }
    try {
      boolean recipientIsAdminInbox =
          ConversationConstants.ADMIN_INBOX_PROFILE_ID.equals(recipientProfileId);
      ConversationResponse conversationForRecipient = toResponse(
          conversation,
          recipientProfileId,
          recipientIsAdminInbox);
      String payload = objectMapper.writeValueAsString(Map.of(
          "type", "MESSAGE",
          "message", message,
          "conversation", conversationForRecipient));
      TextMessage textMessage = new TextMessage(payload);
      for (WebSocketSession session : sessions) {
        if (session.isOpen()) {
          session.sendMessage(textMessage);
        }
      }
    } catch (JsonProcessingException ex) {
      log.warn("Failed to serialize websocket message payload: {}", ex.getMessage());
    } catch (Exception ex) {
      log.warn("Failed to push websocket message: {}", ex.getMessage());
    }
  }

  private ConversationResponse toResponse(
      ConversationDocument document,
      String viewerProfileId,
      boolean adminRole) {
    ConversationDocument resolved = backfillFacilityImageIfMissing(document);
    long unreadCount;
    if (viewerProfileId.equals(resolved.getBuyerProfileId())) {
      unreadCount = resolved.getUnreadByBuyer();
    } else if (isAdminSideViewer(resolved, viewerProfileId, adminRole)
        || ConversationConstants.ADMIN_INBOX_PROFILE_ID.equals(viewerProfileId)) {
      unreadCount = resolved.getUnreadBySeller();
    } else {
      unreadCount = resolved.getUnreadBySeller();
    }
    return ConversationResponse.builder()
        .id(resolved.getId())
        .conversationType(resolved.getConversationType() == null
            ? ConversationType.FACILITY.name()
            : resolved.getConversationType().name())
        .buyerProfileId(resolved.getBuyerProfileId())
        .sellerProfileId(resolved.getSellerProfileId())
        .facilityId(resolved.getFacilityId())
        .facilityName(resolved.getFacilityName())
        .facilityImageUrl(resolved.getFacilityImageUrl())
        .lastMessagePreview(resolved.getLastMessagePreview())
        .lastMessageAt(resolved.getLastMessageAt())
        .unreadCount(unreadCount)
        .createdAt(resolved.getCreatedAt())
        .updatedAt(resolved.getUpdatedAt())
        .build();
  }

  private ConversationDocument backfillFacilityImageIfMissing(ConversationDocument document) {
    if (StringUtils.hasText(document.getFacilityImageUrl()) || !StringUtils.hasText(document.getFacilityId())) {
      return document;
    }
    try {
      FacilitySummary facility = productClients.getFacility(document.getBuyerProfileId(), document.getFacilityId());
      if (StringUtils.hasText(facility.getImageUrl())) {
        document.setFacilityImageUrl(facility.getImageUrl().trim());
        return conversationRepository.save(document);
      }
    } catch (RuntimeException ex) {
      log.debug("Skip facility image backfill for {}: {}", document.getFacilityId(), ex.getMessage());
    }
    return document;
  }

  private MessageResponse toMessageResponse(MessageDocument document) {
    return MessageResponse.builder()
        .id(document.getId())
        .conversationId(document.getConversationId())
        .senderProfileId(document.getSenderProfileId())
        .content(document.getContent())
        .imageUrls(document.getImageUrls())
        .productCard(document.getProductCard())
        .orderCard(document.getOrderCard())
        .createdAt(document.getCreatedAt())
        .build();
  }

  private static int normalizeLimit(Integer limit) {
    if (limit == null || limit <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(limit, 100);
  }

  private static String requireProfileId(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    return profileId.trim();
  }

  private static String requireText(String value, ErrorCode errorCode) {
    if (!StringUtils.hasText(value)) {
      throw new AppException(errorCode);
    }
    return value.trim();
  }
}
