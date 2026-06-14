package com.naodab.productservice.services.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.client.PhonePricingClient;
import com.naodab.productservice.client.PhonePricingRequestMapper;
import com.naodab.productservice.config.CacheConfig;
import com.naodab.productservice.dto.request.AiAnalyzeRequest;
import com.naodab.productservice.dto.request.AiDescriptionRequest;
import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import com.naodab.productservice.dto.response.AiAnalyzeResponse;
import com.naodab.productservice.dto.response.AiDescriptionResponse;
import com.naodab.productservice.dto.response.AiSuggestPriceResponse;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.CategoryRepository;
import com.naodab.productservice.services.AiService;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

  private static final String GEMINI_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
  private static final String APPLICATION_JSON = MediaType.APPLICATION_JSON_VALUE;

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

  private final ObjectMapper objectMapper;
  private final CategoryRepository categoryRepository;
  private final AttributeRepository attributeRepository;
  private final PhonePricingClient phonePricingClient;

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
      String text = callGemini(List.of(Map.of("text", prompt)), 400, 0.7, null, null);
      return new AiDescriptionResponse(text.trim());
    } catch (HttpClientErrorException.TooManyRequests e) {
      log.warn("Gemini rate limit (description)");
      throw new AppException(ErrorCode.AI_SERVICE_BUSY);
    } catch (Exception e) {
      log.error("AI description failed", e);
      throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }
  }

  @Override
  public AiSuggestPriceResponse suggestPrice(AiSuggestPriceRequest request) {
    String listingType = normalizeListingType(request.getListingType());
    String rentUnit = normalizeRentUnit(request.getRentUnit(), listingType);

    if (!PhonePricingRequestMapper.isPhoneSubCategory(request)) {
      return lowConfidencePrice(listingType, rentUnit, "Gợi ý giá AI hiện chỉ hỗ trợ điện thoại (mua).");
    }
    if (!"BUY".equals(listingType)) {
      return lowConfidencePrice(listingType, rentUnit, "Mô hình định giá điện thoại chỉ hỗ trợ tin bán (BUY).");
    }
    if (!phonePricingClient.isConfigured()) {
      return lowConfidencePrice(listingType, null, "Dịch vụ định giá điện thoại chưa được cấu hình.");
    }
    return phonePricingClient.suggestPhonePrice(PhonePricingRequestMapper.toPayload(request));
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

      String json = callGemini(parts, 1024, 0.2, APPLICATION_JSON, null);
      GeminiAnalysis raw = parseGeminiAnalysis(json);
      return resolveToIds(raw, ctx);
    } catch (HttpClientErrorException.TooManyRequests e) {
      log.warn("Gemini rate limit (analyze)");
      throw new AppException(ErrorCode.AI_SERVICE_BUSY);
    } catch (Exception e) {
      log.error("AI analyze failed", e);
      throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }
  }

  @Cacheable(value = CacheConfig.AI_DB_CONTEXT_CACHE, key = "'ctx'")
  @Transactional(readOnly = true)
  public DbContext loadDbContext() {
    List<Category> categories = categoryRepository.findAllWithSubCategories();
    List<Attribute> attributes = attributeRepository.findAllWithValues();
    return DbContext.build(categories, attributes);
  }

  private AiSuggestPriceResponse lowConfidencePrice(
      String listingType, String rentUnit, String reasoningBrief) {
    return AiSuggestPriceResponse.builder()
        .listingType(listingType)
        .rentUnit("RENT".equals(listingType) ? rentUnit : null)
        .confidence("LOW")
        .reasoningBrief(reasoningBrief)
        .build();
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
    if (notEmpty(request.getSubCategoryNames())) {
      sb.append("Category: ").append(String.join(", ", request.getSubCategoryNames())).append("\n");
    }
    if (notEmpty(request.getAttributeValues())) {
      sb.append("Attributes: ").append(String.join(", ", request.getAttributeValues())).append("\n");
    }
    if (request.getListingType() != null && !request.getListingType().isBlank()) {
      sb.append("Listing type: ")
          .append("RENT".equalsIgnoreCase(request.getListingType()) ? "For Rent" : "For Sale")
          .append("\n");
    }
    sb.append("\nRespond with the Vietnamese description only.");
    return sb.toString();
  }

  private AiAnalyzeResponse resolveToIds(GeminiAnalysis raw, DbContext ctx) {
    CategoryResolution categories = resolveCategories(raw, ctx);
    AiAnalyzeResponse result = new AiAnalyzeResponse();
    result.setName(raw.getName());
    result.setDescription(raw.getDescription());
    result.setCategoryIds(categories.categoryIds());
    result.setSubCategoryIds(categories.subCategoryIds());
    result.setAttributeValues(resolveAttributeHints(raw.getAttributeHints(), ctx));
    return result;
  }

  private CategoryResolution resolveCategories(GeminiAnalysis raw, DbContext ctx) {
    LinkedHashSet<String> subCategoryIds = new LinkedHashSet<>();
    LinkedHashSet<String> categoryIds = new LinkedHashSet<>();

    for (String hint : safeList(raw.getSubCategoryHints())) {
      fuzzyMatchId(hint, ctx.subNormToId).ifPresent(subId -> {
        subCategoryIds.add(subId);
        Optional.ofNullable(ctx.subToCat.get(subId)).ifPresent(categoryIds::add);
      });
    }

    if (categoryIds.isEmpty()) {
      for (String hint : safeList(raw.getCategoryHints())) {
        fuzzyMatchId(hint, ctx.catNormToId).ifPresent(categoryIds::add);
      }
    }

    return new CategoryResolution(new ArrayList<>(subCategoryIds), new ArrayList<>(categoryIds));
  }

  private List<AiAnalyzeResponse.AttributeValueRef> resolveAttributeHints(
      List<GeminiAnalysis.HintPair> hints, DbContext ctx) {
    List<AiAnalyzeResponse.AttributeValueRef> attrValues = new ArrayList<>();
    for (GeminiAnalysis.HintPair hint : safeList(hints)) {
      resolveAttributeValueRef(hint, ctx).ifPresent(attrValues::add);
    }
    return attrValues;
  }

  private Optional<AiAnalyzeResponse.AttributeValueRef> resolveAttributeValueRef(
      GeminiAnalysis.HintPair hint, DbContext ctx) {
    return fuzzyMatchId(hint.getName(), ctx.attrNormToId)
        .flatMap(attrId -> Optional.ofNullable(ctx.attrValueMap.get(attrId))
            .flatMap(valMap -> fuzzyMatchId(hint.getValue(), valMap)
                .map(valId -> new AiAnalyzeResponse.AttributeValueRef(attrId, valId))));
  }

  private Optional<String> fuzzyMatchId(String hint, Map<String, String> normToId) {
    String normalized = norm(hint);
    if (normalized.isEmpty()) {
      return Optional.empty();
    }
    for (Map.Entry<String, String> entry : normToId.entrySet()) {
      if (fuzzyMatch(normalized, entry.getKey())) {
        return Optional.of(entry.getValue());
      }
    }
    return Optional.empty();
  }

  private String callGemini(
      List<Map<String, Object>> parts,
      int maxTokens,
      double temperature,
      String responseMimeType,
      Map<String, Object> responseSchema) {
    String url = String.format(GEMINI_BASE_URL, geminiModel, geminiApiKey);

    Map<String, Object> genConfig = new HashMap<>();
    genConfig.put("maxOutputTokens", maxTokens);
    genConfig.put("temperature", temperature);
    if (responseMimeType != null) {
      genConfig.put("responseMimeType", responseMimeType);
    }
    if (responseSchema != null) {
      genConfig.put("responseSchema", responseSchema);
    }

    Map<String, Object> body = new HashMap<>();
    body.put("contents", List.of(Map.of("parts", parts)));
    body.put("generationConfig", genConfig);

    JsonNode response = restClient.post()
        .uri(url)
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .body(JsonNode.class);

    JsonNode candidate = response.path("candidates").path(0);
    String finishReason = candidate.path("finishReason").asText("");
    if ("MAX_TOKENS".equals(finishReason)) {
      log.warn("Gemini response truncated (MAX_TOKENS, maxOutputTokens={})", maxTokens);
    }

    return extractGeminiText(candidate.path("content"));
  }

  private static String extractGeminiText(JsonNode content) {
    JsonNode parts = content.path("parts");
    if (!parts.isArray()) {
      return "";
    }
    StringBuilder text = new StringBuilder();
    for (JsonNode part : parts) {
      if (part.has("text")) {
        text.append(part.path("text").asText(""));
      }
    }
    return text.toString().trim();
  }

  private GeminiAnalysis parseGeminiAnalysis(String raw) {
    try {
      String json = stripMarkdownCodeFence(raw);
      return objectMapper.readValue(json, GeminiAnalysis.class);
    } catch (Exception e) {
      log.warn("Failed to parse AI analyze JSON: {}", raw, e);
      return new GeminiAnalysis();
    }
  }

  private static String stripMarkdownCodeFence(String raw) {
    String json = raw.trim();
    if (!json.startsWith("```")) {
      return json;
    }
    int lineEnd = json.indexOf('\n');
    if (lineEnd < 0) {
      return json;
    }
    json = json.substring(lineEnd + 1);
    int closing = json.lastIndexOf("```");
    if (closing >= 0) {
      json = json.substring(0, closing);
    }
    return json.trim();
  }

  private static String normalizeListingType(String listingType) {
    if (listingType != null && "RENT".equalsIgnoreCase(listingType.trim())) {
      return "RENT";
    }
    return "BUY";
  }

  private static String normalizeRentUnit(String rentUnit, String listingType) {
    if (!"RENT".equals(listingType)) {
      return null;
    }
    if (rentUnit == null || rentUnit.isBlank()) {
      return "DAY";
    }
    String unit = rentUnit.trim().toUpperCase();
    return switch (unit) {
      case "HOUR", "DAY", "WEEK", "MONTH" -> unit;
      default -> "DAY";
    };
  }

  private static boolean fuzzyMatch(String left, String right) {
    return left.contains(right) || right.contains(left);
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

  private record CategoryResolution(List<String> subCategoryIds, List<String> categoryIds) {}

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
        Map<String, Map<String, String>> attrValueMap) {
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
      appendCategorySection(prompt, categories, catNormToId, subNormToId, subToCat);

      Map<String, String> attrNormToId = new LinkedHashMap<>();
      Map<String, Map<String, String>> attrValueMap = new HashMap<>();
      appendAttributeSection(prompt, attributes, attrNormToId, attrValueMap);

      return new DbContext(prompt.toString(), catNormToId, subNormToId, subToCat, attrNormToId, attrValueMap);
    }

    private static void appendCategorySection(
        StringBuilder prompt,
        List<Category> categories,
        Map<String, String> catNormToId,
        Map<String, String> subNormToId,
        Map<String, String> subToCat) {
      prompt.append("AVAILABLE CATEGORIES AND SUBCATEGORIES ")
          .append("(use these exact Vietnamese names in categoryHints and subCategoryHints):\n");
      for (Category cat : categories) {
        appendCategoryLine(prompt, cat, catNormToId, subNormToId, subToCat);
      }
    }

    private static void appendCategoryLine(
        StringBuilder prompt,
        Category cat,
        Map<String, String> catNormToId,
        Map<String, String> subNormToId,
        Map<String, String> subToCat) {
      catNormToId.put(normName(cat.getName()), cat.getId());
      prompt.append("- ").append(cat.getName());
      List<SubCategory> subs = cat.getSubCategories();
      if (subs != null && !subs.isEmpty()) {
        prompt.append(": ")
            .append(subs.stream().map(SubCategory::getName).collect(Collectors.joining(", ")));
        registerSubCategories(subs, cat.getId(), subNormToId, subToCat);
      }
      prompt.append("\n");
    }

    private static void registerSubCategories(
        List<SubCategory> subs,
        String categoryId,
        Map<String, String> subNormToId,
        Map<String, String> subToCat) {
      for (SubCategory sub : subs) {
        subNormToId.put(normName(sub.getName()), sub.getId());
        subToCat.put(sub.getId(), categoryId);
      }
    }

    private static void appendAttributeSection(
        StringBuilder prompt,
        List<Attribute> attributes,
        Map<String, String> attrNormToId,
        Map<String, Map<String, String>> attrValueMap) {
      prompt.append("\nAVAILABLE ATTRIBUTES AND VALUES ")
          .append("(use these exact Vietnamese names in attributeHints):\n");
      for (Attribute attr : attributes) {
        appendAttributeLine(prompt, attr, attrNormToId, attrValueMap);
      }
    }

    private static void appendAttributeLine(
        StringBuilder prompt,
        Attribute attr,
        Map<String, String> attrNormToId,
        Map<String, Map<String, String>> attrValueMap) {
      List<AttributeValue> vals = attr.getAttributeValues();
      if (vals == null || vals.isEmpty()) {
        return;
      }
      AttributeValuesEntry entry = collectAttributeValues(vals);
      if (entry.valMap.isEmpty()) {
        return;
      }
      attrNormToId.put(normName(attr.getName()), attr.getId());
      attrValueMap.put(attr.getId(), entry.valMap);
      prompt.append("- ").append(attr.getName()).append(": ")
          .append(String.join(", ", entry.valNames)).append("\n");
    }

    private static AttributeValuesEntry collectAttributeValues(List<AttributeValue> vals) {
      Map<String, String> valMap = new LinkedHashMap<>();
      List<String> valNames = new ArrayList<>();
      for (AttributeValue v : vals) {
        if (v.getValue() == null || v.getValue().isBlank()) {
          continue;
        }
        valMap.put(normName(v.getValue()), v.getId());
        valNames.add(v.getValue());
      }
      return new AttributeValuesEntry(valMap, valNames);
    }

    private static String normName(String name) {
      return name.toLowerCase().trim();
    }

    private record AttributeValuesEntry(Map<String, String> valMap, List<String> valNames) {}
  }
}
