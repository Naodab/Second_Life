package com.naodab.productservice.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AiSuggestPriceRequest {
  @NotBlank
  private String productName;
  private String productDescription;
  private String listingTitle;
  private String listingDescription;

  @NotBlank
  private String listingType;
  private String variantLabel;
  private List<String> subCategoryNames;
  private String primarySubCategoryId;
  private List<String> subCategoryIds;
  private List<String> attributeLines;
  private Integer manufactureYear;
  private String rentUnit;
  private String regionName;
  private Long currentListedPriceVnd;
  private List<String> images;
  private List<String> imageUrls;
}
