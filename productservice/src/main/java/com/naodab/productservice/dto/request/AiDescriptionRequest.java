package com.naodab.productservice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class AiDescriptionRequest {
    private String productName;
    private List<String> subCategoryNames;
    private List<String> attributeValues;
    private List<String> imageUrls;
    private String listingType;
}
