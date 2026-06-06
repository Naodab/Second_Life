package com.naodab.mailservice.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.mailservice.dto.MessagePayload;
import com.naodab.mailservice.models.MessageDocument;
import com.naodab.mailservice.models.MessageOrderCard;
import com.naodab.mailservice.models.MessageProductCard;

final class MessagePayloadSupport {

  private static final int MAX_CONTENT_LENGTH = 4000;
  private static final int MAX_IMAGES = 10;
  private static final int MAX_URL_LENGTH = 2048;
  private static final int MAX_PREVIEW_LENGTH = 200;

  private MessagePayloadSupport() {
  }

  static MessageDocument buildDocument(String conversationId, String senderProfileId, MessagePayload payload) {
    NormalizedPayload normalized = normalize(payload);
    return MessageDocument.builder()
        .conversationId(conversationId)
        .senderProfileId(senderProfileId)
        .content(normalized.content())
        .imageUrls(normalized.imageUrls())
        .productCard(normalized.productCard())
        .orderCard(normalized.orderCard())
        .build();
  }

  static boolean hasPayload(MessagePayload payload) {
    if (payload == null) {
      return false;
    }
    if (StringUtils.hasText(payload.getContent())) {
      return true;
    }
    if (payload.getImageUrls() != null && !payload.getImageUrls().isEmpty()) {
      return true;
    }
    return payload.getProductCard() != null || payload.getOrderCard() != null;
  }

  static String buildPreview(MessageDocument message) {
    if (StringUtils.hasText(message.getContent())) {
      return truncate(message.getContent().trim());
    }
    if (message.getProductCard() != null && StringUtils.hasText(message.getProductCard().getTitle())) {
      return truncate("[Sản phẩm] " + message.getProductCard().getTitle().trim());
    }
    if (message.getOrderCard() != null && StringUtils.hasText(message.getOrderCard().getTitle())) {
      return truncate("[Đơn hàng] " + message.getOrderCard().getTitle().trim());
    }
    if (message.getImageUrls() != null && !message.getImageUrls().isEmpty()) {
      return "[Ảnh]";
    }
    return "";
  }

  private static NormalizedPayload normalize(MessagePayload payload) {
    if (payload == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    String content = payload.getContent() != null ? payload.getContent().trim() : null;
    if (StringUtils.hasText(content) && content.length() > MAX_CONTENT_LENGTH) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (!StringUtils.hasText(content)) {
      content = null;
    }

    List<String> imageUrls = normalizeImageUrls(payload.getImageUrls());
    MessageProductCard productCard = normalizeProductCard(payload.getProductCard());
    MessageOrderCard orderCard = normalizeOrderCard(payload.getOrderCard());

    if (content == null && imageUrls.isEmpty() && productCard == null && orderCard == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return new NormalizedPayload(content, imageUrls, productCard, orderCard);
  }

  private static List<String> normalizeImageUrls(List<String> rawUrls) {
    if (rawUrls == null || rawUrls.isEmpty()) {
      return List.of();
    }
    if (rawUrls.size() > MAX_IMAGES) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    List<String> normalized = new ArrayList<>();
    for (String rawUrl : rawUrls) {
      if (!StringUtils.hasText(rawUrl)) {
        continue;
      }
      String url = rawUrl.trim();
      if (url.length() > MAX_URL_LENGTH || !isAllowedImageUrl(url)) {
        throw new AppException(ErrorCode.INVALID_INPUT);
      }
      normalized.add(url);
    }
    return List.copyOf(normalized);
  }

  private static MessageProductCard normalizeProductCard(MessageProductCard raw) {
    if (raw == null) {
      return null;
    }
    String listingId = requireText(raw.getListingId());
    String title = requireText(raw.getTitle());
    return MessageProductCard.builder()
        .listingId(listingId)
        .listingVariantId(trimToNull(raw.getListingVariantId()))
        .title(title)
        .thumbnailUrl(trimToNull(raw.getThumbnailUrl()))
        .listingType(normalizeListingType(raw.getListingType()))
        .price(raw.getPrice())
        .build();
  }

  private static MessageOrderCard normalizeOrderCard(MessageOrderCard raw) {
    if (raw == null) {
      return null;
    }
    String orderId = requireText(raw.getOrderId());
    String title = requireText(raw.getTitle());
    return MessageOrderCard.builder()
        .orderId(orderId)
        .orderType(normalizeOrderType(raw.getOrderType()))
        .status(trimToNull(raw.getStatus()))
        .title(title)
        .thumbnailUrl(trimToNull(raw.getThumbnailUrl()))
        .amount(raw.getAmount())
        .build();
  }

  private static boolean isAllowedImageUrl(String url) {
    String lower = url.toLowerCase(Locale.ROOT);
    return lower.startsWith("https://") || lower.startsWith("http://");
  }

  private static String normalizeListingType(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim().toUpperCase(Locale.ROOT);
  }

  private static String normalizeOrderType(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    String normalized = value.trim().toUpperCase(Locale.ROOT);
    if ("BUY".equals(normalized) || "RENT".equals(normalized)) {
      return normalized;
    }
    throw new AppException(ErrorCode.INVALID_INPUT);
  }

  private static String requireText(String value) {
    if (!StringUtils.hasText(value)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return value.trim();
  }

  private static String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }

  private static String truncate(String value) {
    if (value.length() <= MAX_PREVIEW_LENGTH) {
      return value;
    }
    return value.substring(0, MAX_PREVIEW_LENGTH);
  }

  private record NormalizedPayload(
      String content,
      List<String> imageUrls,
      MessageProductCard productCard,
      MessageOrderCard orderCard) {
  }
}
