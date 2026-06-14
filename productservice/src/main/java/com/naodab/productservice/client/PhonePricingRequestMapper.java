package com.naodab.productservice.client;

import com.naodab.productservice.dto.request.AiSuggestPriceRequest;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PhonePricingRequestMapper {

  private static final String SUB_PHONE = "sub-phone";
  private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)");

  private PhonePricingRequestMapper() {
  }

  public static boolean isPhoneSubCategory(AiSuggestPriceRequest request) {
    if (request == null) {
      return false;
    }
    if (SUB_PHONE.equals(trim(request.getPrimarySubCategoryId()))) {
      return true;
    }
    List<String> ids = request.getSubCategoryIds();
    return ids != null && ids.stream().anyMatch(SUB_PHONE::equals);
  }

  public static Map<String, Object> toPayload(AiSuggestPriceRequest request) {
    Map<String, String> attrs = parseAttributeLines(request.getAttributeLines());
    mergeVariantLabel(attrs, request.getVariantLabel());

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("subCategoryId", SUB_PHONE);
    payload.put("listingType", "BUY");
    payload.put("productName", request.getProductName().trim());
    payload.put("modelName", request.getProductName().trim());

    String title = firstNonBlank(request.getListingTitle(), request.getProductName());
    if (StringUtils.hasText(title)) {
      payload.put("title", title.trim());
      payload.put("listingTitle", title.trim());
    }

    String description = joinNonBlank(
        request.getListingDescription(),
        request.getProductDescription(),
        batteryHint(attrs.get("battery health")));
    if (StringUtils.hasText(description)) {
      payload.put("description", description);
      payload.put("listingDescription", description);
      payload.put("productDescription", description);
    }

    if (request.getManufactureYear() != null && request.getManufactureYear() > 1990) {
      payload.put("manufactureYear", request.getManufactureYear());
    }
    if (StringUtils.hasText(request.getRegionName())) {
      payload.put("regionName", request.getRegionName().trim());
    }

    putIfPresent(payload, "brand", firstNonBlank(attrs.get("brand"), inferBrandFromName(request.getProductName())));
    putIfPresent(payload, "condition", attrs.get("condition"));
    putIfPresent(payload, "color", attrs.get("color"));
    putIfPresent(payload, "simLock", mapSimLock(attrs.get("sim lock")));

    Double ramGb = parseNumber(attrs.get("ram"));
    if (ramGb != null) {
      payload.put("ramGb", ramGb);
    }

    Double storageGb = parseStorageGb(attrs.get("capacity"));
    if (storageGb == null) {
      storageGb = inferStorageFromName(request.getProductName());
    }
    if (storageGb != null) {
      payload.put("storageGb", storageGb);
      payload.put("capacity", storageGb);
    }

    Double screenInches = parseScreenInches(attrs.get("screen size"));
    if (screenInches != null) {
      payload.put("screenInches", screenInches);
    }

    Integer originCode = mapOriginCode(attrs.get("origin"));
    if (originCode != null) {
      payload.put("originCode", originCode);
    }

    Integer warrantyCode = mapWarrantyCode(attrs.get("warranty"));
    if (warrantyCode != null) {
      payload.put("warrantyCode", warrantyCode);
    }

    int numImages = request.getImages() != null ? request.getImages().size() : 0;
    if (numImages == 0 && request.getImageUrls() != null) {
      numImages = (int) request.getImageUrls().stream().filter(StringUtils::hasText).count();
    }
    if (numImages > 0) {
      payload.put("numImages", Math.min(numImages, 30));
    }

    return payload;
  }

  private static Map<String, String> parseAttributeLines(List<String> lines) {
    Map<String, String> attrs = new LinkedHashMap<>();
    if (lines == null) {
      return attrs;
    }
    for (String line : lines) {
      if (!StringUtils.hasText(line)) {
        continue;
      }
      int idx = line.indexOf(':');
      if (idx <= 0) {
        continue;
      }
      String key = line.substring(0, idx).trim().toLowerCase(Locale.ROOT);
      String value = line.substring(idx + 1).trim();
      if (!value.isEmpty()) {
        attrs.put(key, value);
      }
    }
    return attrs;
  }

  private static void mergeVariantLabel(Map<String, String> attrs, String variantLabel) {
    if (!StringUtils.hasText(variantLabel)) {
      return;
    }
    for (String part : variantLabel.split("·")) {
      int idx = part.indexOf(':');
      if (idx <= 0) {
        continue;
      }
      String key = part.substring(0, idx).trim().toLowerCase(Locale.ROOT);
      String value = part.substring(idx + 1).trim();
      if (!value.isEmpty()) {
        attrs.putIfAbsent(key, value);
      }
    }
  }

  private static String mapSimLock(String raw) {
    if (!StringUtils.hasText(raw)) {
      return "Unknown";
    }
    String s = raw.toLowerCase(Locale.ROOT);
    if (s.contains("quốc tế") || s.contains("international")) {
      return "International";
    }
    if (s.contains("ghép") || s.contains("unlocked")) {
      return "Unlocked";
    }
    if (s.contains("lock")) {
      return "Locked";
    }
    return "Unknown";
  }

  private static Integer mapOriginCode(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    String s = raw.toLowerCase(Locale.ROOT);
    if (s.contains("chính hãng") || s.contains("official")) {
      return 1;
    }
    return 0;
  }

  private static Integer mapWarrantyCode(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    String s = raw.toLowerCase(Locale.ROOT);
    if (s.contains("còn bảo hành") || s.contains("active")) {
      return 1;
    }
    if (s.contains("hết bảo hành") || s.contains("expired")) {
      return 2;
    }
    return 0;
  }

  private static Double parseNumber(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    Matcher matcher = NUMBER_PATTERN.matcher(raw);
    if (!matcher.find()) {
      return null;
    }
    return Double.parseDouble(matcher.group(1));
  }

  private static Double parseStorageGb(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    String s = raw.toUpperCase(Locale.ROOT).replace(" ", "");
    if (s.contains("TB")) {
      Double n = parseNumber(s);
      return n == null ? null : n * 1024;
    }
    return parseNumber(s);
  }

  private static Double parseScreenInches(String raw) {
    return parseNumber(raw);
  }

  private static String batteryHint(String raw) {
    if (!StringUtils.hasText(raw) || raw.toLowerCase(Locale.ROOT).contains("không rõ")) {
      return null;
    }
    Matcher matcher = NUMBER_PATTERN.matcher(raw);
    if (!matcher.find()) {
      return null;
    }
    return "pin " + matcher.group(1) + "%";
  }

  private static void putIfPresent(Map<String, Object> payload, String key, String value) {
    if (StringUtils.hasText(value)) {
      payload.put(key, value.trim());
    }
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (StringUtils.hasText(value)) {
        return value.trim();
      }
    }
    return null;
  }

  private static String joinNonBlank(String... values) {
    StringBuilder sb = new StringBuilder();
    for (String value : values) {
      if (!StringUtils.hasText(value)) {
        continue;
      }
      if (!sb.isEmpty()) {
        sb.append(' ');
      }
      sb.append(value.trim());
    }
    return sb.isEmpty() ? null : sb.toString();
  }

  private static Double inferStorageFromName(String productName) {
    if (!StringUtils.hasText(productName)) {
      return null;
    }
    Matcher matcher = Pattern.compile("(\\d+)\\s*gb", Pattern.CASE_INSENSITIVE).matcher(productName);
    if (matcher.find()) {
      return Double.parseDouble(matcher.group(1));
    }
    return null;
  }

  private static String inferBrandFromName(String productName) {
    if (!StringUtils.hasText(productName)) {
      return null;
    }
    String lower = productName.toLowerCase(Locale.ROOT);
    if (lower.contains("iphone") || lower.contains("ipad") || lower.contains("macbook")) {
      return "Apple";
    }
    if (lower.contains("galaxy") || lower.contains("samsung")) {
      return "Samsung";
    }
    if (lower.contains("xiaomi") || lower.contains("redmi") || lower.contains("poco")) {
      return "Xiaomi";
    }
    if (lower.contains("oppo")) {
      return "Oppo";
    }
    if (lower.contains("vivo")) {
      return "Vivo";
    }
    if (lower.contains("realme")) {
      return "Realme";
    }
    if (lower.contains("oneplus")) {
      return "OnePlus";
    }
    if (lower.contains("huawei")) {
      return "Huawei";
    }
    if (lower.contains("nokia")) {
      return "Nokia";
    }
    return null;
  }

  private static String trim(String value) {
    return value == null ? null : value.trim();
  }
}
