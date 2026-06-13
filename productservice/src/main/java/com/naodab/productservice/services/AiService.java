package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.AiAnalyzeRequest;
import com.naodab.productservice.dto.request.AiDescriptionRequest;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiAnalyzeResponse;
import com.naodab.productservice.dto.response.AiDescriptionResponse;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;

public interface AiService {
    AiDescriptionResponse generateProductDescription(AiDescriptionRequest request);
    AiAnalyzeResponse analyzeProductImages(AiAnalyzeRequest request);
    AiSuggestPriceResponse suggestPrice(AiSuggestPriceRequest request);
}
