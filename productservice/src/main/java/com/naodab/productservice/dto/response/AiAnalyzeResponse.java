package com.naodab.productservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiAnalyzeResponse {
  private String name;
  private String description;
  private List<String> categoryIds;
  private List<String> subCategoryIds;
  private List<AttributeValueRef> attributeValues;

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class AttributeValueRef {
    private String attributeId;
    private String attributeValueId;
  }
}
