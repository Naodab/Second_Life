package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.CategoryRepository;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

  private static final String GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent?key=test-key";

  @Mock
  CategoryRepository categoryRepository;

  @Mock
  AttributeRepository attributeRepository;

  AiServiceImpl aiService;
  MockRestServiceServer mockServer;
  ObjectMapper objectMapper = new ObjectMapper();

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder();
    mockServer = MockRestServiceServer.bindTo(builder).build();
    RestClient restClient = builder.build();

    aiService = new AiServiceImpl();
    ReflectionTestUtils.setField(aiService, "geminiApiKey", "test-key");
    ReflectionTestUtils.setField(aiService, "geminiModel", "gemini-test");
    ReflectionTestUtils.setField(aiService, "objectMapper", objectMapper);
    ReflectionTestUtils.setField(aiService, "categoryRepository", categoryRepository);
    ReflectionTestUtils.setField(aiService, "attributeRepository", attributeRepository);
    ReflectionTestUtils.setField(aiService, "self", aiService);
    ReflectionTestUtils.setField(aiService, "restClient", restClient);
  }

  @Test
  void suggestPrice_whenApiKeyMissing_returnsUnconfiguredMessage() {
    ReflectionTestUtils.setField(aiService, "geminiApiKey", "");

    AiSuggestPriceRequest request = baseRequest("BUY");

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getReasoningBrief()).isEqualTo("Tính năng AI chưa được cấu hình.");
    assertThat(response.getListingType()).isEqualTo("BUY");
    mockServer.verify();
  }

  @Test
  void suggestPrice_buyListing_parsesGeminiResponse() {
    stubGeminiPriceJson(
        """
        {
          "suggestedPriceVnd": 8500000,
          "priceMinVnd": 7000000,
          "priceMaxVnd": 9500000,
          "confidence": "HIGH",
          "reasoningBrief": "iPhone 13 128GB còn tốt."
        }
        """);

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(8_500_000L);
    assertThat(response.getPriceMinVnd()).isEqualTo(7_000_000L);
    assertThat(response.getPriceMaxVnd()).isEqualTo(9_500_000L);
    assertThat(response.getConfidence()).isEqualTo("HIGH");
    assertThat(response.getReasoningBrief()).isEqualTo("iPhone 13 128GB còn tốt.");
    assertThat(response.getListingType()).isEqualTo("BUY");
    assertThat(response.getRentUnit()).isNull();
    mockServer.verify();
  }

  @Test
  void suggestPrice_rentListing_setsRentUnit() {
    stubGeminiPriceJson(
        """
        {
          "suggestedPriceVnd": 150000,
          "priceMinVnd": 120000,
          "priceMaxVnd": 180000,
          "confidence": "MEDIUM",
          "reasoningBrief": "Máy ảnh cho thuê theo ngày."
        }
        """);

    AiSuggestPriceRequest request = baseRequest("RENT");
    request.setRentUnit("WEEK");

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getListingType()).isEqualTo("RENT");
    assertThat(response.getRentUnit()).isEqualTo("WEEK");
    assertThat(response.getSuggestedPriceVnd()).isEqualTo(150_000L);
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenSuggestedPriceBelowMinimum_returnsInsufficientInfo() {
    stubGeminiPriceJson(
        """
        {
          "suggestedPriceVnd": 5000,
          "priceMinVnd": 4000,
          "priceMaxVnd": 6000,
          "confidence": "LOW",
          "reasoningBrief": "Không rõ model."
        }
        """);

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getConfidence()).isEqualTo("LOW");
    assertThat(response.getReasoningBrief()).isEqualTo("Không đủ thông tin để ước tính giá.");
    mockServer.verify();
  }

  @Test
  void suggestPrice_derivesMinMaxWhenGeminiReturnsInvalidBand() {
    stubGeminiPriceJson(
        """
        {
          "suggestedPriceVnd": 1000000,
          "priceMinVnd": 0,
          "priceMaxVnd": 500000,
          "confidence": "invalid",
          "reasoningBrief": "Ước tính sơ bộ."
        }
        """);

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(1_000_000L);
    assertThat(response.getPriceMinVnd()).isEqualTo(800_000L);
    assertThat(response.getPriceMaxVnd()).isEqualTo(1_200_000L);
    assertThat(response.getConfidence()).isEqualTo("MEDIUM");
    mockServer.verify();
  }

  @Test
  void suggestPrice_parsesMarkdownFencedJson() {
    stubGeminiPriceJson(
        """
        ```json
        {
          "suggestedPriceVnd": 2500000,
          "priceMinVnd": 2000000,
          "priceMaxVnd": 3000000,
          "confidence": "HIGH",
          "reasoningBrief": "Laptop cũ giá hợp lý."
        }
        ```
        """);

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(2_500_000L);
    mockServer.verify();
  }

  @Test
  void suggestPrice_withImages_includesInlineDataInRequest() {
    mockServer
        .expect(requestTo(GEMINI_URL))
        .andExpect(method(HttpMethod.POST))
        .andExpect(request -> {
          String body = request.getBody().toString();
          assertThat(body).contains("inlineData");
          assertThat(body).contains("img-one");
          assertThat(body).contains("img-two");
          assertThat(body).contains("responseSchema");
        })
        .andRespond(withSuccess(
            wrapGeminiText(
                """
                {
                  "suggestedPriceVnd": 5000000,
                  "priceMinVnd": 4000000,
                  "priceMaxVnd": 6000000,
                  "confidence": "HIGH",
                  "reasoningBrief": "OK"
                }
                """),
            MediaType.APPLICATION_JSON));

    AiSuggestPriceRequest request = baseRequest("BUY");
    request.setImages(List.of("img-one", "img-two", "img-three-should-be-ignored"));

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(5_000_000L);
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenJsonTruncated_extractsPartialFields() {
    stubGeminiPriceJson(
        """
        {
          "suggestedPriceVnd": 8500000,
          "priceMinVnd": 7000000,
          "priceMaxVnd": 9500000,
          "confidence": "HIGH",
          "reasoningBrief": "iPhone 13 còn t
        """);

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(8_500_000L);
    assertThat(response.getPriceMinVnd()).isEqualTo(7_000_000L);
    assertThat(response.getPriceMaxVnd()).isEqualTo(9_500_000L);
    assertThat(response.getConfidence()).isEqualTo("HIGH");
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenJsonIncompleteWithImages_retriesTextOnly() {
    mockServer
        .expect(requestTo(GEMINI_URL))
        .andExpect(method(HttpMethod.POST))
        .andExpect(request -> assertThat(request.getBody().toString()).contains("inlineData"))
        .andRespond(withSuccess(wrapGeminiText("{\n  \"suggestedPriceVnd"), MediaType.APPLICATION_JSON));
    mockServer
        .expect(requestTo(GEMINI_URL))
        .andExpect(method(HttpMethod.POST))
        .andExpect(request -> assertThat(request.getBody().toString()).doesNotContain("inlineData"))
        .andRespond(withSuccess(
            wrapGeminiText(
                """
                {
                  "suggestedPriceVnd": 3200000,
                  "priceMinVnd": 2800000,
                  "priceMaxVnd": 3600000,
                  "confidence": "MEDIUM",
                  "reasoningBrief": "Retry thành công."
                }
                """),
            MediaType.APPLICATION_JSON));

    AiSuggestPriceRequest request = baseRequest("BUY");
    request.setImages(List.of("img-one"));

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(3_200_000L);
    assertThat(response.getReasoningBrief()).isEqualTo("Retry thành công.");
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenGeminiReturnsInvalidJson_returnsInsufficientInfo() {
    stubGeminiPriceJson("not-json");

    AiSuggestPriceResponse response = aiService.suggestPrice(baseRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getConfidence()).isEqualTo("LOW");
    assertThat(response.getReasoningBrief()).isEqualTo("Không đủ thông tin để ước tính giá.");
    mockServer.verify();
  }

  private AiSuggestPriceRequest baseRequest(String listingType) {
    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setProductName("iPhone 13 128GB");
    request.setListingType(listingType);
    return request;
  }

  private void stubGeminiPriceJson(String priceJson) {
    mockServer
        .expect(requestTo(GEMINI_URL))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withSuccess(wrapGeminiText(priceJson), MediaType.APPLICATION_JSON));
  }

  private static String wrapGeminiText(String text) {
    String escaped = text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    return """
        {
          "candidates": [{
            "content": {
              "parts": [{ "text": "%s" }]
            }
          }]
        }
        """.formatted(escaped);
  }
}
