package com.naodab.productservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import com.naodab.productservice.services.AiService;

@WebMvcTest(controllers = AiController.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, AiController.class })
class AiControllerTest {

  @Autowired
  MockMvc mockMvc;

  @Autowired
  ObjectMapper objectMapper;

  @MockitoBean
  AiService aiService;

  @Test
  void suggestPrice_delegatesToService() throws Exception {
    AiSuggestPriceResponse response = AiSuggestPriceResponse.builder()
        .suggestedPriceVnd(5_000_000L)
        .priceMinVnd(4_000_000L)
        .priceMaxVnd(6_000_000L)
        .confidence("HIGH")
        .reasoningBrief("Giá hợp lý cho điện thoại cũ.")
        .listingType("BUY")
        .build();
    when(aiService.suggestPrice(any())).thenReturn(response);

    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setProductName("Samsung Galaxy S23");
    request.setListingType("BUY");

    mockMvc.perform(post("/ai/suggest-price")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.suggestedPriceVnd").value(5_000_000))
        .andExpect(jsonPath("$.data.confidence").value("HIGH"))
        .andExpect(jsonPath("$.data.listingType").value("BUY"));

    verify(aiService).suggestPrice(any());
  }

  @Test
  void suggestPrice_whenProductNameMissing_returnsBadRequest() throws Exception {
    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setListingType("BUY");

    mockMvc.perform(post("/ai/suggest-price")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }
}
