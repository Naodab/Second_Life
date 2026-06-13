package com.naodab.productservice.controllers;

import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.AiAnalyzeRequest;
import com.naodab.productservice.dto.request.AiDescriptionRequest;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiAnalyzeResponse;
import com.naodab.productservice.dto.response.AiDescriptionResponse;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import com.naodab.productservice.services.AiService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AiController {

    AiService aiService;

    @PostMapping("/generate-description")
    public ResponseEntity<ApiResponse<AiDescriptionResponse>> generateDescription(
            @Valid @RequestBody AiDescriptionRequest request) {
        return ResponseEntity.ok(ApiResponse.<AiDescriptionResponse>builder()
                .data(aiService.generateProductDescription(request))
                .build());
    }

    @PostMapping("/analyze-product")
    public ResponseEntity<ApiResponse<AiAnalyzeResponse>> analyzeProduct(
            @Valid @RequestBody AiAnalyzeRequest request) {
        return ResponseEntity.ok(ApiResponse.<AiAnalyzeResponse>builder()
                .data(aiService.analyzeProductImages(request))
                .build());
    }

    @PostMapping("/suggest-price")
    public ResponseEntity<ApiResponse<AiSuggestPriceResponse>> suggestPrice(
            @Valid @RequestBody AiSuggestPriceRequest request) {
        return ResponseEntity.ok(ApiResponse.<AiSuggestPriceResponse>builder()
                .data(aiService.suggestPrice(request))
                .build());
    }
}
