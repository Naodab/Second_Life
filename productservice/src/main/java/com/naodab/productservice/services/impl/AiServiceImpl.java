package com.naodab.productservice.services.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.config.CacheConfig;
import com.naodab.productservice.client.PhonePricingClient;
import com.naodab.productservice.client.PhonePricingRequestMapper;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

  private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

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

  private static final String PRICE_SUGGESTION_SYSTEM_PROMPT = """
      You are a senior pricing analyst for "Second Life" — a Vietnamese second-hand marketplace (comparable to Chợ Tốt / Facebook Marketplace VN).

      ## Your task
      Estimate a fair **used-item market price in Vietnam (VND)** for ONE unit described in the user message.
      Think like a buyer comparing similar listings in Hà Nội & TP.HCM (national average; regional hint if provided).

      ## Market calibration (must follow)
      1. Prices are **second-hand resale**, NOT new retail, NOT import MSRP, NOT promotional flash-sale prices.
      2. Cross-check mentally against typical VN classifieds for the same brand/model/spec tier before answering.
      3. Round final integers to natural VN listing prices (often ending in 0,000 or 50,000 — e.g. 4,950,000 not 4,947,123).
      4. If `currentListedPriceVnd` is provided, compare your estimate to it in `reasoningBrief` (hợp lý / hơi cao / hơi thấp / rất cao).

      ## Condition from photos (if attached)
      Grade visible condition, then discount from "good used" baseline:
      - Like new (95–100%): minimal wear, screen/body clean
      - Good (80–94%): light scratches OK
      - Fair (60–79%): obvious wear, dents, or heavy use
      - Poor (<60%): cracks, missing parts, heavy damage
      Worse condition → lower price. Never ignore visible defects.

      ## Category heuristics (adjust by specs & condition)
      - **Phones / tablets**: flagship loses ~25–40%/year early, mid-range ~20–30%; storage/RAM tier matters; check iPhone/Samsung/Oppo/Xiaomi model + capacity.
      - **Laptops / PC**: CPU generation + RAM + SSD size drive price; gaming GPU adds premium; battery/screen issues −10–25%.
      - **Cameras / lenses**: body + lens kit; shutter count / fungus / scratches if inferable from text/photos.
      - **Fashion / bags**: brand tier (luxury vs fast fashion); authenticity uncertainty → confidence LOW & conservative price.
      - **Furniture / appliances**: size & brand; functional wear vs cosmetic only.
      - **Kids / books / misc**: usually low ticket; avoid over-estimating vague items.

      ## Listing type
      - listingType = BUY → `suggestedPriceVnd` = recommended **selling price** for one unit.
      - listingType = RENT → `suggestedPriceVnd` = **rent fee for ONE rentUnit** (not purchase price).
        Rent vs resale value (approximate, tune by item):
        HOUR ~0.2–0.8% · DAY ~1–3% · WEEK ~5–10% · MONTH ~15–25%

      ## Output fields
      - `priceMinVnd` / `priceMaxVnd`: realistic negotiation band (~±15–25% around suggested).
      - `confidence`: HIGH = clear brand+model+specs; MEDIUM = partial; LOW = vague/missing key info.
      - `reasoningBrief`: exactly ONE short Vietnamese sentence (vi-VN) citing the main price driver.
      - Do NOT invent specs absent from input. If insufficient data → conservative estimate, confidence=LOW.
      - Output ONLY valid JSON matching the schema. No markdown, no code fences, no extra text.

      ## Output JSON schema
      {
        "suggestedPriceVnd": <integer>,
        "priceMinVnd": <integer>,
        "priceMaxVnd": <integer>,
        "confidence": "HIGH" | "MEDIUM" | "LOW",
        "reasoningBrief": "<Vietnamese string>"
      }
      """;

  private static final long MIN_PRICE_VND = 10_000L;
  private static final long MAX_PRICE_VND = 500_000_000L;
  private static final int MAX_PRICE_SUGGESTION_IMAGES = 2;
  private static final int PRICE_SUGGESTION_MAX_OUTPUT_TOKENS = 1024;

  private static final Map<String, Object> PRICE_SUGGESTION_RESPONSE_SCHEMA = priceSuggestionResponseSchema();

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
      return AiSuggestPriceResponse.builder()
          .listingType(listingType)
          .rentUnit("RENT".equals(listingType) ? rentUnit : null)
          .confidence("LOW")
          .reasoningBrief("Gợi ý giá AI hiện chỉ hỗ trợ điện thoại (mua).")
          .build();
    }

    if (!"BUY".equals(listingType)) {
      return AiSuggestPriceResponse.builder()
          .listingType(listingType)
          .rentUnit(rentUnit)
          .confidence("LOW")
          .reasoningBrief("Mô hình định giá điện thoại chỉ hỗ trợ tin bán (BUY).")
          .build();
    }

    if (!phonePricingClient.isConfigured()) {
      return AiSuggestPriceResponse.builder()
          .listingType(listingType)
          .confidence("LOW")
          .reasoningBrief("Dịch vụ định giá điện thoại chưa được cấu hình.")
          .build();
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

      String json = callGemini(parts, 1024, 0.2, "application/json", null);
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

  private String buildAnalyzePrompt(String dbContext) {
    return "Analyze the provided second-hand product image(s) for \"Second Life\" — a Vietnamese marketplace.\n\n"
        + "IMPORTANT: Use ONLY the categories, subcategories, and attribute values listed below. "
        + "Never invent names outside these lists.\n\n"
        + dbContext
        + ANALYZE_PROMPT_SUFFIX;
  }

  private List<Map<String, Object>> buildPriceSuggestionParts(String prompt, List<String> base64Images) {
    List<Map<String, Object>> parts = new ArrayList<>();
    parts.add(Map.of("text", prompt));

    for (String base64 : base64Images) {
      if (base64 != null && !base64.isBlank()) {
        parts.add(Map.of("inlineData", Map.of("mimeType", "image/jpeg", "data", base64.trim())));
      }
    }
    return parts;
  }

  private List<String> resolvePriceSuggestionImages(AiSuggestPriceRequest request) {
    List<String> resolved = new ArrayList<>();
    if (request.getImages() != null) {
      for (String img : request.getImages()) {
        if (img != null && !img.isBlank()) {
          resolved.add(img.trim());
        }
        if (resolved.size() >= MAX_PRICE_SUGGESTION_IMAGES) {
          return resolved;
        }
      }
    }
    if (!resolved.isEmpty() || request.getImageUrls() == null) {
      return resolved;
    }
    for (String url : request.getImageUrls()) {
      if (url == null || url.isBlank()) {
        continue;
      }
      fetchImageBase64(url.trim()).ifPresent(resolved::add);
      if (resolved.size() >= MAX_PRICE_SUGGESTION_IMAGES) {
        break;
      }
    }
    return resolved;
  }

  private java.util.Optional<String> fetchImageBase64(String url) {
    try {
      byte[] bytes = restClient.get()
          .uri(url)
          .retrieve()
          .body(byte[].class);
      if (bytes == null || bytes.length == 0) {
        return java.util.Optional.empty();
      }
      return java.util.Optional.of(java.util.Base64.getEncoder().encodeToString(bytes));
    } catch (Exception e) {
      log.warn("Failed to fetch image for price suggestion: {}", url, e);
      return java.util.Optional.empty();
    }
  }

  private String buildPriceSuggestionUserMessage(
      AiSuggestPriceRequest request,
      String listingType,
      String rentUnit,
      int attachedImageCount) {
    StringBuilder sb = new StringBuilder();
    sb.append("## Product\n");
    sb.append("name: ").append(request.getProductName().trim()).append("\n");
    if (notBlank(request.getProductDescription())) {
      sb.append("description: ").append(request.getProductDescription().trim()).append("\n");
    }
    if (request.getManufactureYear() != null && request.getManufactureYear() > 1990) {
      sb.append("manufactureYear: ").append(request.getManufactureYear()).append("\n");
    }
    if (notEmpty(request.getSubCategoryNames())) {
      sb.append("categories: ").append(String.join(", ", request.getSubCategoryNames())).append("\n");
    }
    if (notEmpty(request.getAttributeLines())) {
      sb.append("attributes:\n");
      for (String line : request.getAttributeLines()) {
        if (notBlank(line)) {
          sb.append("  - ").append(line.trim()).append("\n");
        }
      }
    }
    if (notBlank(request.getVariantLabel())) {
      sb.append("variant: ").append(request.getVariantLabel().trim()).append("\n");
    }

    sb.append("\n## Listing\n");
    sb.append("listingType: ").append(listingType).append("\n");
    if ("RENT".equals(listingType)) {
      sb.append("rentUnit: ").append(rentUnit).append("\n");
    }
    if (notBlank(request.getListingTitle())) {
      sb.append("title: ").append(request.getListingTitle().trim()).append("\n");
    }
    if (notBlank(request.getListingDescription())) {
      sb.append("listingDescription: ").append(request.getListingDescription().trim()).append("\n");
    }
    if (notBlank(request.getRegionName())) {
      sb.append("region: ").append(request.getRegionName().trim()).append("\n");
    }
    if (request.getCurrentListedPriceVnd() != null && request.getCurrentListedPriceVnd() > 0) {
      sb.append("currentListedPriceVnd: ").append(request.getCurrentListedPriceVnd()).append("\n");
    }

    if (attachedImageCount > 0) {
      sb.append("\n## Photos\n");
      sb.append(attachedImageCount).append(" product photo(s) attached — use them to judge condition.\n");
    }

    sb.append("\nRespond with JSON only.");
    return sb.toString();
  }

  private AiSuggestPriceResponse toPriceResponse(
      GeminiPriceSuggestion raw,
      String listingType,
      String rentUnit) {
    long suggested = clampPrice(raw.getSuggestedPriceVnd());
    long min = clampPrice(raw.getPriceMinVnd());
    long max = clampPrice(raw.getPriceMaxVnd());

    if (suggested <= 0) {
      return AiSuggestPriceResponse.builder()
          .listingType(listingType)
          .rentUnit("RENT".equals(listingType) ? rentUnit : null)
          .confidence("LOW")
          .reasoningBrief("Không đủ thông tin để ước tính giá.")
          .build();
    }

    if (min <= 0 || min > suggested) {
      min = Math.round(suggested * 0.8);
    }
    if (max <= 0 || max < suggested) {
      max = Math.round(suggested * 1.2);
    }
    if (min > max) {
      long tmp = min;
      min = max;
      max = tmp;
    }

    String confidence = raw.getConfidence();
    if (confidence == null || !List.of("HIGH", "MEDIUM", "LOW").contains(confidence.toUpperCase())) {
      confidence = "MEDIUM";
    } else {
      confidence = confidence.toUpperCase();
    }

    return AiSuggestPriceResponse.builder()
        .suggestedPriceVnd(suggested)
        .priceMinVnd(min)
        .priceMaxVnd(max)
        .confidence(confidence)
        .reasoningBrief(
            raw.getReasoningBrief() != null && !raw.getReasoningBrief().isBlank()
                ? raw.getReasoningBrief().trim()
                : "Ước tính dựa trên thị trường đồ cũ Việt Nam.")
        .listingType(listingType)
        .rentUnit("RENT".equals(listingType) ? rentUnit : null)
        .build();
  }

  private long clampPrice(Number value) {
    if (value == null) {
      return 0L;
    }
    long v = value.longValue();
    if (v < MIN_PRICE_VND) {
      return 0L;
    }
    return Math.min(v, MAX_PRICE_VND);
  }

  private GeminiPriceSuggestion parseGeminiPriceSuggestion(String raw) {
    String json = stripMarkdownCodeFence(raw);
    if (json.isBlank()) {
      return new GeminiPriceSuggestion();
    }
    try {
      return objectMapper.readValue(json, GeminiPriceSuggestion.class);
    } catch (JsonProcessingException e) {
      log.warn("Failed to parse AI price JSON ({} chars): {}", json.length(), truncateForLog(json));
      return extractPartialPriceSuggestion(json);
    } catch (Exception e) {
      log.warn("Failed to parse AI price JSON: {}", truncateForLog(json), e);
      return extractPartialPriceSuggestion(json);
    }
  }

  private static boolean hasSuggestedPrice(GeminiPriceSuggestion raw) {
    return raw != null && raw.getSuggestedPriceVnd() != null && raw.getSuggestedPriceVnd() > 0;
  }

  private static GeminiPriceSuggestion extractPartialPriceSuggestion(String raw) {
    GeminiPriceSuggestion result = new GeminiPriceSuggestion();
    result.setSuggestedPriceVnd(extractJsonLong(raw, "suggestedPriceVnd"));
    result.setPriceMinVnd(extractJsonLong(raw, "priceMinVnd"));
    result.setPriceMaxVnd(extractJsonLong(raw, "priceMaxVnd"));
    result.setConfidence(extractJsonString(raw, "confidence"));
    result.setReasoningBrief(extractJsonString(raw, "reasoningBrief"));
    return result;
  }

  private static Long extractJsonLong(String raw, String field) {
    Matcher matcher = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*(\\d+)").matcher(raw);
    if (!matcher.find()) {
      return null;
    }
    try {
      return Long.parseLong(matcher.group(1));
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private static String extractJsonString(String raw, String field) {
    Matcher matcher = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
        .matcher(raw);
    if (!matcher.find()) {
      return null;
    }
    return matcher.group(1).replace("\\\"", "\"").replace("\\\\", "\\");
  }

  private static String truncateForLog(String raw) {
    if (raw == null) {
      return "";
    }
    String oneLine = raw.replace('\n', ' ').replace('\r', ' ').trim();
    return oneLine.length() <= 160 ? oneLine : oneLine.substring(0, 160) + "...";
  }

  private static Map<String, Object> priceSuggestionResponseSchema() {
    Map<String, Object> confidence = new LinkedHashMap<>();
    confidence.put("type", "string");
    confidence.put("enum", List.of("HIGH", "MEDIUM", "LOW"));

    Map<String, Object> properties = new LinkedHashMap<>();
    properties.put("suggestedPriceVnd", Map.of("type", "integer"));
    properties.put("priceMinVnd", Map.of("type", "integer"));
    properties.put("priceMaxVnd", Map.of("type", "integer"));
    properties.put("confidence", confidence);
    properties.put("reasoningBrief", Map.of("type", "string"));

    Map<String, Object> schema = new LinkedHashMap<>();
    schema.put("type", "object");
    schema.put("properties", properties);
    schema.put(
        "required",
        List.of("suggestedPriceVnd", "priceMinVnd", "priceMaxVnd", "confidence", "reasoningBrief"));
    return schema;
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
    String u = rentUnit.trim().toUpperCase();
    return switch (u) {
      case "HOUR", "DAY", "WEEK", "MONTH" -> u;
      default -> "DAY";
    };
  }

  private boolean notBlank(String s) {
    return s != null && !s.isBlank();
  }

  private String buildDescriptionUserMessage(AiDescriptionRequest request) {
    StringBuilder sb = new StringBuilder();
    sb.append("Product name: ").append(request.getProductName()).append("\n");
    if (notEmpty(request.getSubCategoryNames()))
      sb.append("Category: ").append(String.join(", ", request.getSubCategoryNames())).append("\n");
    if (notEmpty(request.getAttributeValues()))
      sb.append("Attributes: ").append(String.join(", ", request.getAttributeValues())).append("\n");
    if (request.getListingType() != null && !request.getListingType().isBlank())
      sb.append("Listing type: ").append("RENT".equalsIgnoreCase(request.getListingType()) ? "For Rent" : "For Sale")
          .append("\n");
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
      List<GeminiAnalysis.HintPair> hints,
      DbContext ctx) {
    List<AiAnalyzeResponse.AttributeValueRef> attrValues = new ArrayList<>();
    for (GeminiAnalysis.HintPair hint : safeList(hints)) {
      resolveAttributeValueRef(hint, ctx).ifPresent(attrValues::add);
    }
    return attrValues;
  }

  private Optional<AiAnalyzeResponse.AttributeValueRef> resolveAttributeValueRef(
      GeminiAnalysis.HintPair hint,
      DbContext ctx) {
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

  private static boolean fuzzyMatch(String left, String right) {
    return left.contains(right) || right.contains(left);
  }

  private record CategoryResolution(List<String> subCategoryIds, List<String> categoryIds) {
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
  static class GeminiPriceSuggestion {
    private Long suggestedPriceVnd;
    private Long priceMinVnd;
    private Long priceMaxVnd;
    private String confidence;
    private String reasoningBrief;
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
      var subs = cat.getSubCategories();
      if (subs != null && !subs.isEmpty()) {
        prompt.append(": ")
            .append(subs.stream().map(s -> s.getName()).collect(Collectors.joining(", ")));
        registerSubCategories(subs, cat.getId(), subNormToId, subToCat);
      }
      prompt.append("\n");
    }

    private static void registerSubCategories(
        List<SubCategory> subs,
        String categoryId,
        Map<String, String> subNormToId,
        Map<String, String> subToCat) {
      for (var sub : subs) {
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
      var vals = attr.getAttributeValues();
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

    private static AttributeValuesEntry collectAttributeValues(
        List<AttributeValue> vals) {
      Map<String, String> valMap = new LinkedHashMap<>();
      List<String> valNames = new ArrayList<>();
      for (var v : vals) {
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

    private record AttributeValuesEntry(Map<String, String> valMap, List<String> valNames) {
    }
  }
}
