package com.naodab.productservice.services.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.productservice.config.CacheConfig;
import com.naodab.productservice.dto.request.AiAnalyzeRequest;
import com.naodab.productservice.dto.request.AiDescriptionRequest;
import com.naodab.productservice.dto.response.AiAnalyzeResponse;
import com.naodab.productservice.dto.response.AiDescriptionResponse;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.CategoryRepository;
import com.naodab.productservice.services.AiService;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiServiceImpl implements AiService {

  private static final String GEMINI_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

  private static final String DESCRIPTION_PROMPT = """
    You are an expert copywriter for "Second Life" — a Vietnamese second-hand marketplace.

    Write a short, honest, engaging product description in Vietnamese (vi-VN) based on the input below.

    Rules:
    - 2 to 4 sentences, concise
    - Highlight the most notable feature and actual condition of the used item
    - Natural, friendly tone — no hollow marketing phrases
    - Never invent information not present in the input
    - Output ONLY the plain paragraph. No title, no bullets, no markdown.
    """;

  private static final String ANALYZE_PROMPT_SUFFIX = """

    Return this exact JSON (no markdown, no code fences):
    {
      "name": "concise Vietnamese product name",
      "description": "2-4 sentence Vietnamese description of the visible condition",
      "categoryHints": ["category name from the list above"],
      "subCategoryHints": ["subcategory name from the list above"],
      "attributeHints": [{"name": "attribute name from list", "value": "exact value from list"}]
    }

    Rules:
    - name: short, factual (e.g. "Máy ảnh Sony A6000", "Áo khoác len nam cũ")
    - description: honest Vietnamese text; note scratches, wear, discoloration if visible
    - categoryHints: 1-2 best-matching categories from the list
    - subCategoryHints: 1-2 most specific matching subcategories
    - attributeHints: only clearly visible attributes; omit anything you are not confident about
    """;

  @Value("${gemini.api-key:}")
  private String geminiApiKey;

  @Value("${gemini.model:gemini-1.5-flash-8b}")
  private String geminiModel;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private CategoryRepository categoryRepository;

  @Autowired
  private AttributeRepository attributeRepository;

  @Autowired
  @Lazy
  private AiServiceImpl self;

  private final RestClient restClient = RestClient.create();

  @Override
  public AiDescriptionResponse generateProductDescription(AiDescriptionRequest request) {
    if (!isConfigured(geminiApiKey)) {
      return new AiDescriptionResponse("Tính năng AI chưa được cấu hình.");
    }
    try {
      String prompt = DESCRIPTION_PROMPT + "\n---\n" + buildDescriptionUserMessage(request);
      String text = callGemini(List.of(Map.of("text", prompt)), 400, 0.7, null);
      return new AiDescriptionResponse(text.trim());
    } catch (HttpClientErrorException.TooManyRequests e) {
      log.warn("Gemini rate limit (description)");
      throw new RuntimeException("AI đang bận, vui lòng thử lại sau vài giây.");
    } catch (Exception e) {
      log.error("AI description failed", e);
      throw new RuntimeException("Không thể tạo mô tả AI lúc này. Vui lòng thử lại sau.");
    }
  }

  @Override
  public AiAnalyzeResponse analyzeProductImages(AiAnalyzeRequest request) {
    if (!isConfigured(geminiApiKey)) {
      log.warn("GEMINI_API_KEY not configured.");
      return new AiAnalyzeResponse();
    }
    if (request.getImages() == null || request.getImages().isEmpty()) {
      throw new IllegalArgumentException("At least one image is required.");
    }
    try {
      DbContext ctx = self.loadDbContext();

      List<Map<String, Object>> parts = new ArrayList<>();
      parts.add(Map.of("text", buildAnalyzePrompt(ctx.promptContext)));
      for (String base64 : request.getImages()) {
        parts.add(Map.of("inlineData", Map.of("mimeType", "image/jpeg", "data", base64)));
      }

      String json = callGemini(parts, 1024, 0.2, "application/json");
      GeminiAnalysis raw = parseGeminiAnalysis(json);
      return resolveToIds(raw, ctx);

    } catch (HttpClientErrorException.TooManyRequests e) {
      log.warn("Gemini rate limit (analyze)");
      throw new RuntimeException("AI đang bận, vui lòng thử lại sau vài giây.");
    } catch (Exception e) {
      log.error("AI analyze failed", e);
      throw new RuntimeException("Không thể phân tích ảnh lúc này. Vui lòng thử lại sau.");
    }
  }

  @Cacheable(value = CacheConfig.AI_DB_CONTEXT_CACHE, key = "'ctx'")
  @Transactional(readOnly = true)
  public DbContext loadDbContext() {
    List<Category> categories = categoryRepository.findAllWithSubCategories();
    List<Attribute> attributes = attributeRepository.findAllWithValues();
    return DbContext.build(categories, attributes);
  }

  private String buildAnalyzePrompt(String dbContext) {
    return "Analyze the provided second-hand product image(s) for \"Second Life\" — a Vietnamese marketplace.\n\n"
      + "IMPORTANT: Use ONLY the categories, subcategories, and attribute values listed below. "
      + "Never invent names outside these lists.\n\n"
      + dbContext
      + ANALYZE_PROMPT_SUFFIX;
  }

  private String buildDescriptionUserMessage(AiDescriptionRequest request) {
    StringBuilder sb = new StringBuilder();
    sb.append("Product name: ").append(request.getProductName()).append("\n");
    if (notEmpty(request.getSubCategoryNames()))
      sb.append("Category: ").append(String.join(", ", request.getSubCategoryNames())).append("\n");
    if (notEmpty(request.getAttributeValues()))
      sb.append("Attributes: ").append(String.join(", ", request.getAttributeValues())).append("\n");
    if (request.getListingType() != null && !request.getListingType().isBlank())
      sb.append("Listing type: ").append("RENT".equalsIgnoreCase(request.getListingType()) ? "For Rent" : "For Sale").append("\n");
    sb.append("\nRespond with the Vietnamese description only.");
    return sb.toString();
  }

  private AiAnalyzeResponse resolveToIds(GeminiAnalysis raw, DbContext ctx) {
    AiAnalyzeResponse result = new AiAnalyzeResponse();
    result.setName(raw.getName());
    result.setDescription(raw.getDescription());

    List<String> subCategoryIds = new ArrayList<>();
    List<String> categoryIds = new ArrayList<>();

    for (String hint : safeList(raw.getSubCategoryHints())) {
      String norm = norm(hint);
      for (Map.Entry<String, String> entry : ctx.subNormToId.entrySet()) {
        if (entry.getKey().contains(norm) || norm.contains(entry.getKey())) {
          String subId = entry.getValue();
          if (!subCategoryIds.contains(subId)) subCategoryIds.add(subId);
          String catId = ctx.subToCat.get(subId);
          if (catId != null && !categoryIds.contains(catId)) categoryIds.add(catId);
          break;
        }
      }
    }

    if (categoryIds.isEmpty()) {
      for (String hint : safeList(raw.getCategoryHints())) {
        String norm = norm(hint);
        for (Map.Entry<String, String> entry : ctx.catNormToId.entrySet()) {
          if (entry.getKey().contains(norm) || norm.contains(entry.getKey())) {
            if (!categoryIds.contains(entry.getValue())) categoryIds.add(entry.getValue());
            break;
          }
        }
      }
    }

    result.setCategoryIds(categoryIds);
    result.setSubCategoryIds(subCategoryIds);

    List<AiAnalyzeResponse.AttributeValueRef> attrValues = new ArrayList<>();
    for (GeminiAnalysis.HintPair hint : safeList(raw.getAttributeHints())) {
      String attrNorm = norm(hint.getName());
      String attrId = null;
      for (Map.Entry<String, String> entry : ctx.attrNormToId.entrySet()) {
        if (entry.getKey().contains(attrNorm) || attrNorm.contains(entry.getKey())) {
          attrId = entry.getValue();
          break;
        }
      }
      if (attrId == null) continue;
      Map<String, String> valMap = ctx.attrValueMap.get(attrId);
      if (valMap == null) continue;
      String valNorm = norm(hint.getValue());
      for (Map.Entry<String, String> entry : valMap.entrySet()) {
        if (entry.getKey().contains(valNorm) || valNorm.contains(entry.getKey())) {
          attrValues.add(new AiAnalyzeResponse.AttributeValueRef(attrId, entry.getValue()));
          break;
        }
      }
    }
    result.setAttributeValues(attrValues);
    return result;
  }

  private String callGemini(List<Map<String, Object>> parts, int maxTokens, double temperature, String responseMimeType) {
    String url = String.format(GEMINI_BASE_URL, geminiModel, geminiApiKey);

    Map<String, Object> genConfig = new HashMap<>();
    genConfig.put("maxOutputTokens", maxTokens);
    genConfig.put("temperature", temperature);
    if (responseMimeType != null) genConfig.put("responseMimeType", responseMimeType);

    Map<String, Object> body = new HashMap<>();
    body.put("contents", List.of(Map.of("parts", parts)));
    body.put("generationConfig", genConfig);

    JsonNode response = restClient.post()
      .uri(url)
      .contentType(MediaType.APPLICATION_JSON)
      .body(body)
      .retrieve()
      .body(JsonNode.class);

    return response
      .path("candidates").path(0)
      .path("content").path("parts").path(0)
      .path("text").asText("").trim();
  }

  private GeminiAnalysis parseGeminiAnalysis(String raw) {
    try {
      String json = raw.trim();
      if (json.startsWith("```")) {
        json = json.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
      }
      return objectMapper.readValue(json, GeminiAnalysis.class);
    } catch (Exception e) {
      log.warn("Failed to parse AI analyze JSON: {}", raw, e);
      return new GeminiAnalysis();
    }
  }

  private String norm(String s) {
    return s == null ? "" : s.toLowerCase().trim();
  }

  private <T> List<T> safeList(List<T> list) {
    return list != null ? list : List.of();
  }

  private boolean isConfigured(String key) {
    return key != null && !key.isBlank();
  }

  private boolean notEmpty(List<String> list) {
    return list != null && !list.isEmpty();
  }

  @Data
  @NoArgsConstructor
  @JsonIgnoreProperties(ignoreUnknown = true)
  static class GeminiAnalysis {
    private String name;
    private String description;
    private List<String> categoryHints;
    private List<String> subCategoryHints;
    private List<HintPair> attributeHints;

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class HintPair {
      private String name;
      private String value;
    }
  }

  static class DbContext {
    final String promptContext;
    final Map<String, String> catNormToId;
    final Map<String, String> subNormToId;
    final Map<String, String> subToCat;
    final Map<String, String> attrNormToId;
    final Map<String, Map<String, String>> attrValueMap;

    DbContext(
      String promptContext,
      Map<String, String> catNormToId,
      Map<String, String> subNormToId,
      Map<String, String> subToCat,
      Map<String, String> attrNormToId,
      Map<String, Map<String, String>> attrValueMap
    ) {
      this.promptContext = promptContext;
      this.catNormToId = catNormToId;
      this.subNormToId = subNormToId;
      this.subToCat = subToCat;
      this.attrNormToId = attrNormToId;
      this.attrValueMap = attrValueMap;
    }

    static DbContext build(List<Category> categories, List<Attribute> attributes) {
      StringBuilder prompt = new StringBuilder();
      Map<String, String> catNormToId = new LinkedHashMap<>();
      Map<String, String> subNormToId = new LinkedHashMap<>();
      Map<String, String> subToCat = new HashMap<>();

      prompt.append("AVAILABLE CATEGORIES AND SUBCATEGORIES ")
        .append("(use these exact Vietnamese names in categoryHints and subCategoryHints):\n");

      for (Category cat : categories) {
        catNormToId.put(cat.getName().toLowerCase().trim(), cat.getId());
        var subs = cat.getSubCategories();
        prompt.append("- ").append(cat.getName());
        if (subs != null && !subs.isEmpty()) {
          prompt.append(": ")
            .append(subs.stream().map(s -> s.getName()).collect(Collectors.joining(", ")));
          for (var sub : subs) {
            subNormToId.put(sub.getName().toLowerCase().trim(), sub.getId());
            subToCat.put(sub.getId(), cat.getId());
          }
        }
        prompt.append("\n");
      }

      Map<String, String> attrNormToId = new LinkedHashMap<>();
      Map<String, Map<String, String>> attrValueMap = new HashMap<>();

      prompt.append("\nAVAILABLE ATTRIBUTES AND VALUES ")
        .append("(use these exact Vietnamese names in attributeHints):\n");

      for (Attribute attr : attributes) {
        var vals = attr.getAttributeValues();
        if (vals == null || vals.isEmpty()) continue;
        attrNormToId.put(attr.getName().toLowerCase().trim(), attr.getId());
        Map<String, String> valMap = new LinkedHashMap<>();
        List<String> valNames = new ArrayList<>();
        for (var v : vals) {
          if (v.getValue() == null || v.getValue().isBlank()) continue;
          valMap.put(v.getValue().toLowerCase().trim(), v.getId());
          valNames.add(v.getValue());
        }
        if (!valMap.isEmpty()) {
          attrValueMap.put(attr.getId(), valMap);
          prompt.append("- ").append(attr.getName()).append(": ")
            .append(String.join(", ", valNames)).append("\n");
        }
      }

      return new DbContext(prompt.toString(), catNormToId, subNormToId, subToCat, attrNormToId, attrValueMap);
    }
  }
}
