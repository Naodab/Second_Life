package com.naodab.productservice.services;

import com.naodab.productservice.dto.request.AiAnalyzeRequest;
import com.naodab.productservice.dto.request.AiDescriptionRequest;
import com.naodab.productservice.dto.response.AiAnalyzeResponse;
import com.naodab.productservice.dto.response.AiDescriptionResponse;

public interface AiService {
    AiDescriptionResponse generateProductDescription(AiDescriptionRequest request);
    AiAnalyzeResponse analyzeProductImages(AiAnalyzeRequest request);
}
