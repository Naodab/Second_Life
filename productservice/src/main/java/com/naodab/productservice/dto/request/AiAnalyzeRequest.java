package com.naodab.productservice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class AiAnalyzeRequest {
    private List<String> images;
}
