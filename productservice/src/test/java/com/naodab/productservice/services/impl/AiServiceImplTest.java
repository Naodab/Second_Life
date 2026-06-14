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
import com.naodab.productservice.client.PhonePricingClient;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.CategoryRepository;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

  private static final String PHONE_PRICING_URL = "http://ai-service.test/api/v1/ai/suggest-price/phone";

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

    PhonePricingClient phonePricingClient = new PhonePricingClient(restClient, "http://ai-service.test");

    aiService = new AiServiceImpl(objectMapper, categoryRepository, attributeRepository, phonePricingClient, null);
    ReflectionTestUtils.setField(aiService, "geminiApiKey", "test-key");
    ReflectionTestUtils.setField(aiService, "geminiModel", "gemini-test");
    ReflectionTestUtils.setField(aiService, "self", aiService);
    ReflectionTestUtils.setField(aiService, "restClient", restClient);
  }

  @Test
  void suggestPrice_whenNotPhoneSubCategory_returnsUnsupportedMessage() {
    AiSuggestPriceRequest request = baseRequest("BUY");
    request.setPrimarySubCategoryId("sub-laptop");

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getReasoningBrief()).contains("chỉ hỗ trợ điện thoại");
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenPhoneRentListing_returnsRentUnsupportedMessage() {
    AiSuggestPriceRequest request = baseRequest("RENT");
    request.setPrimarySubCategoryId("sub-phone");
    request.setRentUnit("DAY");

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getReasoningBrief()).contains("chỉ hỗ trợ tin bán");
    assertThat(response.getRentUnit()).isEqualTo("DAY");
    mockServer.verify();
  }

  @Test
  void suggestPrice_phoneBuyListing_callsMlService() {
    stubPhonePricingJson(
        """
        {
          "suggestedPriceVnd": 8500000,
          "priceMinVnd": 7000000,
          "priceMaxVnd": 9500000,
          "confidence": "HIGH",
          "reasoningBrief": "iPhone 13 128GB còn tốt.",
          "listingType": "BUY"
        }
        """);

    AiSuggestPriceRequest request = phoneRequest("BUY");
    request.setAttributeLines(List.of("Brand: Apple", "Capacity: 128 GB", "RAM: 6 GB"));

    AiSuggestPriceResponse response = aiService.suggestPrice(request);

    assertThat(response.getSuggestedPriceVnd()).isEqualTo(8_500_000L);
    assertThat(response.getPriceMinVnd()).isEqualTo(7_000_000L);
    assertThat(response.getPriceMaxVnd()).isEqualTo(9_500_000L);
    assertThat(response.getConfidence()).isEqualTo("HIGH");
    assertThat(response.getReasoningBrief()).isEqualTo("iPhone 13 128GB còn tốt.");
    assertThat(response.getListingType()).isEqualTo("BUY");
    mockServer.verify();
  }

  @Test
  void suggestPrice_whenAiServiceNotConfigured_returnsUnconfiguredMessage() {
    aiService = new AiServiceImpl(
        objectMapper,
        categoryRepository,
        attributeRepository,
        new PhonePricingClient(RestClient.create(), ""),
        null);
    ReflectionTestUtils.setField(aiService, "self", aiService);

    AiSuggestPriceResponse response = aiService.suggestPrice(phoneRequest("BUY"));

    assertThat(response.getSuggestedPriceVnd()).isNull();
    assertThat(response.getReasoningBrief()).contains("chưa được cấu hình");
    mockServer.verify();
  }

  private AiSuggestPriceRequest baseRequest(String listingType) {
    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setProductName("iPhone 13 128GB");
    request.setListingType(listingType);
    return request;
  }

  private AiSuggestPriceRequest phoneRequest(String listingType) {
    AiSuggestPriceRequest request = baseRequest(listingType);
    request.setPrimarySubCategoryId("sub-phone");
    return request;
  }

  private void stubPhonePricingJson(String priceJson) {
    mockServer
        .expect(requestTo(PHONE_PRICING_URL))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withSuccess(priceJson, MediaType.APPLICATION_JSON));
  }
}
