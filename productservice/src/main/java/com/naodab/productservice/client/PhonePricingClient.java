package com.naodab.productservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
public class PhonePricingClient {

  private final RestClient restClient;
  private final String aiServiceUrl;
  private final String suggestPhonePath;

  @Autowired
  public PhonePricingClient(
      RestClient restClient,
      @Value("${external.ai-service.url:}") String aiServiceUrl,
      @Value("${external.ai-service.suggest-phone-path:/api/v1/ai/suggest-price/phone}") String suggestPhonePath) {
    this.restClient = restClient;
    this.aiServiceUrl = aiServiceUrl;
    this.suggestPhonePath = suggestPhonePath;
  }

  /** Visible for unit tests. */
  public PhonePricingClient(RestClient restClient, String aiServiceUrl) {
    this(restClient, aiServiceUrl, "/api/v1/ai/suggest-price/phone");
  }

  public boolean isConfigured() {
    return StringUtils.hasText(aiServiceUrl);
  }

  public AiSuggestPriceResponse suggestPhonePrice(Map<String, Object> payload) {
    String url = stripTrailingSlashes(aiServiceUrl) + suggestPhonePath;
    try {
      JsonNode body = restClient.post()
          .uri(url)
          .contentType(MediaType.APPLICATION_JSON)
          .body(payload)
          .retrieve()
          .body(JsonNode.class);
      return mapSuccess(body);
    } catch (HttpClientErrorException.BadRequest e) {
      log.warn("Phone pricing rejected request: {}", e.getResponseBodyAsString());
      return AiSuggestPriceResponse.builder()
          .listingType("BUY")
          .confidence("LOW")
          .reasoningBrief(extractErrorMessage(e))
          .build();
    } catch (HttpServerErrorException.ServiceUnavailable e) {
      log.warn("Phone pricing model unavailable: {}", e.getResponseBodyAsString());
      throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    } catch (HttpClientErrorException e) {
      log.error("Phone pricing HTTP error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
      throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    } catch (Exception e) {
      log.error("Phone pricing call failed", e);
      throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }
  }

  private AiSuggestPriceResponse mapSuccess(JsonNode body) {
    if (body == null) {
      return AiSuggestPriceResponse.builder()
          .listingType("BUY")
          .confidence("LOW")
          .reasoningBrief("Không nhận được phản hồi từ dịch vụ định giá.")
          .build();
    }
    return AiSuggestPriceResponse.builder()
        .suggestedPriceVnd(longOrNull(body, "suggestedPriceVnd"))
        .priceMinVnd(longOrNull(body, "priceMinVnd"))
        .priceMaxVnd(longOrNull(body, "priceMaxVnd"))
        .confidence(textOrNull(body, "confidence"))
        .reasoningBrief(textOrNull(body, "reasoningBrief"))
        .listingType(textOrNull(body, "listingType"))
        .build();
  }

  private static Long longOrNull(JsonNode node, String field) {
    JsonNode value = node.get(field);
    if (value == null || value.isNull()) {
      return null;
    }
    return value.asLong();
  }

  private static String textOrNull(JsonNode node, String field) {
    JsonNode value = node.get(field);
    if (value == null || value.isNull()) {
      return null;
    }
    String text = value.asText();
    return text.isBlank() ? null : text;
  }

  private static String extractErrorMessage(HttpClientErrorException e) {
    try {
      JsonNode body = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
      JsonNode message = body.get("message");
      if (message != null && !message.asText().isBlank()) {
        return message.asText().trim();
      }
    } catch (Exception ignored) {
      // AI service error body is not always JSON.
    }
    return "Không đủ thông tin để ước tính giá điện thoại.";
  }

  private static String stripTrailingSlashes(String url) {
    if (url == null) {
      return "";
    }
    String trimmed = url.trim();
    while (trimmed.endsWith("/")) {
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    }
    return trimmed;
  }
}
