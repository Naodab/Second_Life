package com.naodab.productservice.mapper;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductMedia;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;
import com.naodab.productservice.models.SubCategory;

@Component
public class ProductMapper {
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

    Facility facility = product.getFacility();
    GeoPoint location = facility != null && facility.getLatitude() != null && facility.getLongitude() != null
        ? new GeoPoint(facility.getLatitude(), facility.getLongitude())
        : null;

    return ProductDocument.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .thumbnailUrl(thumbnailUrl)
        .productMedias(productMedias)
        .facilityId(facility == null ? null : facility.getId())
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
        .provinceCode(facility == null ? null : facility.getProvinceCode())
        .wardCode(facility == null ? null : facility.getWardCode())
        .location(location)
        .build();
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
    String subId =
        product.getPrimarySubCategory() == null ? null : product.getPrimarySubCategory().getId();

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
    Facility facility = product.getFacility();
    return ProductResponse.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .thumbnailUrl(thumbnailImageUrl(product))
        .facility(facility == null ? null
            : FacilityResponse.builder()
                .id(facility.getId())
                .name(facility.getName())
                .ownerId(facility.getOwnerId())
                .description(facility.getDescription())
                .imageUrl(facility.getImageUrl())
                .linkGoogleMap(facility.getLinkGoogleMap())
                .address(facility.getAddress())
                .provinceCode(facility.getProvinceCode())
                .wardCode(facility.getWardCode())
                .latitude(facility.getLatitude())
                .longitude(facility.getLongitude())
                .viewCount(facility.getViewCount())
                .orderCount(facility.getOrderCount())
                .averageRating(facility.getAverageRating())
                .build())
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
        .attributes(safeAttributes.stream()
            .map(attribute -> AttributeResponse.builder()
                .id(attribute.getId())
                .name(attribute.getName())
                .attributeValues(List.of())
                .build())
            .toList())
        .medias(product.getMedias())
        .status(product.getStatus())
        .build();
  }
}
