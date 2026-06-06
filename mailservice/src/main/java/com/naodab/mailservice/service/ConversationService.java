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
import com.naodab.mailservice.dto.CreateConversationRequest;
import com.naodab.mailservice.dto.FacilitySummary;
import com.naodab.mailservice.dto.MessageResponse;
import com.naodab.mailservice.dto.SendMessageRequest;
import com.naodab.mailservice.models.ConversationDocument;
import com.naodab.mailservice.models.MessageDocument;
import com.naodab.mailservice.repositories.ConversationRepository;
import com.naodab.mailservice.repositories.MessageRepository;

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
        .findByBuyerProfileIdOrderByLastMessageAtDesc(normalizedProfileId, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, normalizedProfileId))
        .toList();
  }

  public List<ConversationResponse> listAsSeller(String profileId, Integer limit) {
    String normalizedProfileId = requireProfileId(profileId);
    int pageSize = normalizeLimit(limit);
    return conversationRepository
        .findBySellerProfileIdOrderByLastMessageAtDesc(normalizedProfileId, PageRequest.of(0, pageSize))
        .stream()
        .map(doc -> toResponse(doc, normalizedProfileId))
        .toList();
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

    return toResponse(conversation, buyerProfileId);
  }

  public List<MessageResponse> listMessages(String profileId, String conversationId, Integer limit) {
    requireAccessibleConversation(profileId, conversationId);
    int pageSize = normalizeLimit(limit);
    List<MessageDocument> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
        conversationId.trim(), PageRequest.of(0, pageSize));
    return messages.stream()
        .sorted(Comparator.comparing(MessageDocument::getCreatedAt))
        .map(this::toMessageResponse)
        .toList();
  }

  public MessageResponse sendMessage(String profileId, String conversationId, SendMessageRequest request) {
    ConversationDocument conversation = requireAccessibleConversation(profileId, conversationId);
    return persistMessage(conversation, requireProfileId(profileId), request);
  }

  public ConversationResponse markRead(String profileId, String conversationId) {
    ConversationDocument conversation = requireAccessibleConversation(profileId, conversationId);
    String normalizedProfileId = requireProfileId(profileId);
    if (normalizedProfileId.equals(conversation.getBuyerProfileId())) {
      conversation.setUnreadByBuyer(0);
    } else if (normalizedProfileId.equals(conversation.getSellerProfileId())) {
      conversation.setUnreadBySeller(0);
    }
    ConversationDocument saved = conversationRepository.save(conversation);
    return toResponse(saved, normalizedProfileId);
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

  private ConversationDocument requireAccessibleConversation(String profileId, String conversationId) {
    String normalizedProfileId = requireProfileId(profileId);
    String normalizedConversationId = requireText(conversationId, ErrorCode.INVALID_INPUT);
    return conversationRepository.findById(normalizedConversationId)
        .filter(doc -> normalizedProfileId.equals(doc.getBuyerProfileId())
            || normalizedProfileId.equals(doc.getSellerProfileId()))
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
  }

  private void pushRealtime(ConversationDocument conversation, MessageResponse message) {
    String recipientProfileId = message.getSenderProfileId().equals(conversation.getBuyerProfileId())
        ? conversation.getSellerProfileId()
        : conversation.getBuyerProfileId();
    Set<WebSocketSession> sessions = sessionRegistry.sessionsFor(recipientProfileId);
    if (sessions.isEmpty()) {
      return;
    }
    try {
      ConversationResponse conversationForRecipient = toResponse(conversation, recipientProfileId);
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

  private ConversationResponse toResponse(ConversationDocument document, String viewerProfileId) {
    ConversationDocument resolved = backfillFacilityImageIfMissing(document);
    long unreadCount = viewerProfileId.equals(resolved.getBuyerProfileId())
        ? resolved.getUnreadByBuyer()
        : resolved.getUnreadBySeller();
    return ConversationResponse.builder()
        .id(resolved.getId())
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
