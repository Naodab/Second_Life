package com.naodab.productservice.mapper;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.productservice.dto.response.AttributeValueResponse;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.dto.response.ProductVariantSummaryResponse;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductMedia;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;
import com.naodab.productservice.models.SubCategory;

@Component
public class ProductMapper {

  public List<Attribute> collectDistinctAttributesFromProduct(Product product) {
    if (product == null || product.getVariants() == null) {
      return List.of();
    }
    LinkedHashMap<String, Attribute> byId = new LinkedHashMap<>();
    for (ProductVariant variant : product.getVariants()) {
      if (variant.getVariantAttributeValues() == null) {
        continue;
      }
      for (ProductVariantAttributeValue link : variant.getVariantAttributeValues()) {
        AttributeValue av = link.getAttributeValue();
        if (av != null && av.getAttribute() != null && StringUtils.hasText(av.getAttribute().getId())) {
          byId.put(av.getAttribute().getId().trim(), av.getAttribute());
        }
      }
    }
    return List.copyOf(byId.values());
  }

  private List<AttributeResponse> buildAttributesWithDistinctVariantValues(Product product, List<Attribute> attrs) {
    if (attrs == null || attrs.isEmpty()) {
      return List.of();
    }
    return attrs.stream()
        .map(attribute -> AttributeResponse.builder()
            .id(attribute.getId())
            .name(attribute.getName())
            .attributeValues(distinctVariantAttributeValues(product, attribute.getId()))
            .build())
        .toList();
  }

  private List<AttributeValueResponse> distinctVariantAttributeValues(Product product, String attributeId) {
    if (product == null || product.getVariants() == null || !StringUtils.hasText(attributeId)) {
      return List.of();
    }
    String aid = attributeId.trim();
    LinkedHashMap<String, AttributeValueResponse> map = new LinkedHashMap<>();
    for (ProductVariant variant : product.getVariants()) {
      collectDistinctValuesForVariant(variant, aid, map);
    }
    return List.copyOf(map.values());
  }

  private static void collectDistinctValuesForVariant(
      ProductVariant variant, String attributeId, LinkedHashMap<String, AttributeValueResponse> map) {
    List<ProductVariantAttributeValue> links = variant.getVariantAttributeValues();
    if (links == null) {
      return;
    }
    for (ProductVariantAttributeValue link : links) {
      putIfMatchingAttributeVariantValue(map, attributeId, link);
    }
  }

  private static void putIfMatchingAttributeVariantValue(
      LinkedHashMap<String, AttributeValueResponse> map, String attributeId, ProductVariantAttributeValue link) {
    AttributeValue av = link.getAttributeValue();
    if (av == null || av.getAttribute() == null) {
      return;
    }
    String vid = av.getId();
    if (!attributeId.equals(av.getAttribute().getId()) || !StringUtils.hasText(vid)) {
      return;
    }
    String key = vid.trim();
    if (map.containsKey(key)) {
      return;
    }
    map.put(
        key,
        AttributeValueResponse.builder().id(key).value(av.getValue()).code(av.getCode()).build());
  }

  public ProductDocument toProductDocument(Product product) {
    if (product == null) {
      return null;
    }

    List<String> subCategoryIds = product.getProductSubCategories() == null
        ? List.of()
        : product.getProductSubCategories()
            .stream()
            .map(ProductSubCategory::getSubCategory)
            .filter(subCategory -> subCategory != null && subCategory.getId() != null)
            .map(subCategory -> subCategory.getId())
            .toList();

    Set<String> categoryIdSet = new LinkedHashSet<>();
    if (product.getProductSubCategories() != null) {
      for (ProductSubCategory link : product.getProductSubCategories()) {
        SubCategory sub = link.getSubCategory();
        Category cat = sub == null ? null : sub.getCategory();
        if (cat != null && StringUtils.hasText(cat.getId())) {
          categoryIdSet.add(cat.getId().trim());
        }
      }
    }
    String primaryCategoryId = null;
    if (product.getPrimarySubCategory() != null) {
      Category pc = product.getPrimarySubCategory().getCategory();
      if (pc != null && StringUtils.hasText(pc.getId())) {
        primaryCategoryId = pc.getId().trim();
        categoryIdSet.add(primaryCategoryId);
      }
    }
    List<String> categoryIds = List.copyOf(categoryIdSet);

    List<ProductVariant> variants = product.getVariants() == null ? List.of() : product.getVariants();
    List<String> variantSkus = variants.stream()
        .map(ProductVariant::getSku)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .distinct()
        .toList();
    List<ProductDocument.VariantDocument> variantDocuments = variants.stream()
        .map(variant -> ProductDocument.VariantDocument.builder()
            .sku(variant.getSku())
            .quantity(variant.getQuantity())
            .build())
        .toList();
    List<ProductMedia> medias = product.getMedias() == null ? List.of() : product.getMedias();
    List<String> productMedias = medias.stream()
        .map(ProductMedia::getMediaUrl)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .distinct()
        .toList();
    String thumbnailUrl = medias.stream()
        .filter(media -> Boolean.TRUE.equals(media.getIsThumbnail()))
        .map(ProductMedia::getMediaUrl)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .findFirst()
        .orElse(null);

    List<String> attributeIds = variants.stream()
        .map(ProductVariant::getVariantAttributeValues)
        .filter(Objects::nonNull)
        .flatMap(List::stream)
        .map(ProductVariantAttributeValue::getAttributeValue)
        .filter(Objects::nonNull)
        .map(attributeValue -> attributeValue.getAttribute())
        .filter(Objects::nonNull)
        .map(attribute -> attribute.getId())
        .filter(Objects::nonNull)
        .distinct()
        .toList();

    List<String> attributeValues = variants.stream()
        .map(ProductVariant::getVariantAttributeValues)
        .filter(Objects::nonNull)
        .flatMap(List::stream)
        .map(ProductVariantAttributeValue::getAttributeValue)
        .filter(Objects::nonNull)
        .map(attributeValue -> attributeValue.getValue())
        .filter(StringUtils::hasText)
        .map(String::trim)
        .distinct()
        .toList();

    return ProductDocument.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .thumbnailUrl(thumbnailUrl)
        .productMedias(productMedias)
        .ownerId(product.getOwnerId())
        .primaryCategoryId(primaryCategoryId)
        .categoryIds(categoryIds.isEmpty() ? List.of() : categoryIds)
        .subCategoryIds(subCategoryIds)
        .primarySubCategoryId(
            product.getPrimarySubCategory() == null ? null : product.getPrimarySubCategory().getId())
        .attributeIds(attributeIds)
        .attributeValues(attributeValues)
        .variantSkus(variantSkus)
        .variants(variantDocuments)
        .status(product.getStatus())
        .createdAt(product.getCreatedAt())
        .updatedAt(product.getUpdatedAt())
        .build();
  }

  static GeoPoint toElasticsearchGeoPoint(Float lat, Float lon) {
    if (lat == null || lon == null) {
      return null;
    }
    double latitude = lat.doubleValue();
    double longitude = lon.doubleValue();
    if (Double.isNaN(latitude) || Double.isNaN(longitude) || Double.isInfinite(latitude)
        || Double.isInfinite(longitude)) {
      return null;
    }
    if (Math.abs(latitude) > 90.0 && Math.abs(longitude) <= 90.0) {
      double tmp = latitude;
      latitude = longitude;
      longitude = tmp;
    }
    if (latitude < -90.0 || latitude > 90.0 || longitude < -180.0 || longitude > 180.0) {
      return null;
    }
    return new GeoPoint(latitude, longitude);
  }

  public String thumbnailImageUrl(Product product) {
    if (product == null || product.getMedias() == null || product.getMedias().isEmpty()) {
      return null;
    }
    return product.getMedias().stream()
        .filter(media -> Boolean.TRUE.equals(media.getIsThumbnail()))
        .map(ProductMedia::getMediaUrl)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .findFirst()
        .orElseGet(() -> product.getMedias().stream()
            .map(ProductMedia::getMediaUrl)
            .filter(StringUtils::hasText)
            .map(String::trim)
            .findFirst()
            .orElse(null));
  }

  public ProductItemResponse toProductItemResponse(Product product) {
    if (product == null) {
      return null;
    }
    List<ProductVariant> variants = product.getVariants() == null ? List.of() : product.getVariants();
    int variantCount = variants.size();
    String subName = product.getPrimarySubCategory() == null ? null : product.getPrimarySubCategory().getName();
    String subId = product.getPrimarySubCategory() == null ? null : product.getPrimarySubCategory().getId();

    return ProductItemResponse.builder()
        .id(product.getId())
        .name(product.getName())
        .thumbnailImage(thumbnailImageUrl(product))
        .status(product.getStatus())
        .primarySubCategoryName(subName)
        .primarySubCategoryId(subId)
        .variantCount(variantCount)
        .createdAt(product.getCreatedAt())
        .build();
  }

  public ProductItemResponse toProductItemResponse(ProductDocument doc) {
    if (doc == null) {
      return null;
    }
    List<ProductDocument.VariantDocument> variants = doc.getVariants() == null ? List.of() : doc.getVariants();
    int variantCount = variants.isEmpty() && doc.getVariantSkus() != null
        ? doc.getVariantSkus().size()
        : variants.size();

    return ProductItemResponse.builder()
        .id(doc.getId())
        .name(doc.getName())
        .thumbnailImage(doc.getThumbnailUrl())
        .status(doc.getStatus())
        .primarySubCategoryName(null)
        .primarySubCategoryId(doc.getPrimarySubCategoryId())
        .variantCount(variantCount)
        .createdAt(doc.getCreatedAt())
        .build();
  }

  public ProductResponse toProductResponse(Product product, List<Attribute> attributes) {
    if (product == null) {
      return null;
    }

    List<Attribute> safeAttributes = attributes == null ? List.of() : attributes;
    return ProductResponse.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .ownerId(product.getOwnerId())
        .thumbnailUrl(thumbnailImageUrl(product))
        .primarySubCategory(product.getPrimarySubCategory() == null ? null
            : CategoryResponse.builder()
                .id(product.getPrimarySubCategory().getId())
                .name(product.getPrimarySubCategory().getName())
                .description(product.getPrimarySubCategory().getDescription())
                .code(product.getPrimarySubCategory().getCode())
                .build())
        .subCategories(product.getProductSubCategories() == null ? List.of()
            : product.getProductSubCategories().stream()
                .map(ProductSubCategory::getSubCategory)
                .filter(Objects::nonNull)
                .map(subCategory -> CategoryResponse.builder()
                    .id(subCategory.getId())
                    .name(subCategory.getName())
                    .description(subCategory.getDescription())
                    .code(subCategory.getCode())
                    .build())
                .toList())
        .attributes(buildAttributesWithDistinctVariantValues(product, safeAttributes))
        .medias(product.getMedias())
        .variants(resolveVariantSummaries(product))
        .status(product.getStatus())
        .build();
  }

  private List<ProductVariantSummaryResponse> resolveVariantSummaries(Product product) {
    if (product.getVariants() == null || product.getVariants().isEmpty()) {
      return List.of();
    }
    return product.getVariants().stream().map(this::toVariantSummary).toList();
  }

  public List<ProductVariantSummaryResponse> toProductVariantSummaryResponses(List<ProductVariant> variants) {
    if (variants == null || variants.isEmpty()) {
      return List.of();
    }
    return variants.stream().map(this::toVariantSummary).toList();
  }

  public ProductVariantSummaryResponse toVariantSummary(ProductVariant v) {
    List<String> attributeValueIds = v.getVariantAttributeValues() == null ? List.of()
        : v.getVariantAttributeValues().stream()
            .map(ProductVariantAttributeValue::getAttributeValue)
            .filter(Objects::nonNull)
            .map(AttributeValue::getId)
            .filter(StringUtils::hasText)
            .map(String::trim)
            .distinct()
            .sorted()
            .toList();

    return ProductVariantSummaryResponse.builder()
        .id(v.getId())
        .sku(v.getSku())
        .quantity(v.getQuantity())
        .label(buildProductVariantLabel(v))
        .attributeValueIds(attributeValueIds)
        .build();
  }

  private String buildProductVariantLabel(ProductVariant v) {
    if (v.getVariantAttributeValues() == null || v.getVariantAttributeValues().isEmpty()) {
      if (StringUtils.hasText(v.getSku())) {
        return v.getSku().trim();
      }
      String idPart = v.getId() != null && v.getId().length() >= 8 ? v.getId().substring(0, 8) : "—";
      return "SKU " + idPart;
    }
    return v.getVariantAttributeValues().stream()
        .map(ProductVariantAttributeValue::getAttributeValue)
        .filter(Objects::nonNull)
        .sorted(Comparator.comparing(av -> {
          Attribute attribute = av.getAttribute();
          return attribute != null && StringUtils.hasText(attribute.getName())
              ? attribute.getName().trim()
              : "";
        }))
        .map(av -> attributeValueLabel(av))
        .collect(Collectors.joining(" · "));
  }

  private static String attributeValueLabel(AttributeValue av) {
    Attribute attribute = av.getAttribute();
    String prefix = attribute != null && StringUtils.hasText(attribute.getName())
        ? attribute.getName().trim()
        : "?";
    String value = av.getValue() != null ? av.getValue().trim() : "";
    return value.isEmpty() ? prefix : prefix + ": " + value;
  }
}
