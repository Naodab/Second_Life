package com.naodab.productservice.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiSuggestPriceRequest {

  @NotBlank
  private String productName;

  private String productDescription;

  private String listingTitle;

  private String listingDescription;

  /** BUY or RENT */
  @NotBlank
  private String listingType;

  /** Variant label, e.g. "Brand: Apple · Capacity: 128GB" */
  private String variantLabel;

  private List<String> subCategoryNames;

  private List<String> attributeLines;

  private Integer manufactureYear;

  /** HOUR, DAY, WEEK, MONTH — required when listingType=RENT */
  private String rentUnit;

  private String regionName;

  /** Seller's current asking price (buy or rent per unit) for comparison in reasoning. */
  private Long currentListedPriceVnd;

  /** Base64-encoded JPEG/PNG (no data-URL prefix), same format as /ai/analyze-product. */
  private List<String> images;

  /** Product image URLs — server fetches when `images` is empty (max 2). */
  private List<String> imageUrls;
}
