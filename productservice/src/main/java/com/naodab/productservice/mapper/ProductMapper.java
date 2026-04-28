package com.naodab.productservice.mapper;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.ProductVariantAttributeValue;

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

    List<ProductVariant> variants = product.getVariants() == null ? List.of() : product.getVariants();
    List<String> variantSkus = variants.stream()
        .map(ProductVariant::getSku)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .distinct()
        .toList();

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
    return ProductDocument.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .facilityId(facility == null ? null : facility.getId())
        .subCategoryIds(subCategoryIds)
        .primarySubCategoryId(product.getPrimarySubCategory() == null ? null : product.getPrimarySubCategory().getId())
        .attributeIds(attributeIds)
        .attributeValues(attributeValues)
        .variantSkus(variantSkus)
        .status(product.getStatus())
        .createdAt(product.getCreatedAt())
        .updatedAt(product.getUpdatedAt())
        .provinceCode(facility == null ? null : facility.getProvinceCode())
        .wardCode(facility == null ? null : facility.getWardCode())
        .latitude(facility == null ? null : facility.getLatitude())
        .longitude(facility == null ? null : facility.getLongitude())
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
        .facility(facility == null ? null : FacilityResponse.builder()
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
        .primarySubCategory(product.getPrimarySubCategory() == null ? null : CategoryResponse.builder()
            .id(product.getPrimarySubCategory().getId())
            .name(product.getPrimarySubCategory().getName())
            .description(product.getPrimarySubCategory().getDescription())
            .code(product.getPrimarySubCategory().getCode())
            .build())
        .subCategories(product.getProductSubCategories() == null ? List.of() : product.getProductSubCategories().stream()
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
