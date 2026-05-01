package com.naodab.productservice.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Product;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ListingMapper {

  private final ProductMapper productMapper;

  public ListingDocument toListingDocument(Listing listing) {
    if (listing == null) {
      return null;
    }
    Product product = listing.getProduct();
    if (product == null || product.getId() == null) {
      return null;
    }

    ProductDocument productDocument = productMapper.toProductDocument(product);
    if (productDocument == null) {
      return null;
    }

    return ListingDocument.builder()
        .id(listing.getId())
        .title(listing.getTitle())
        .listingDescription(listing.getDescription())
        .minPrice(listing.getMinPrice())
        .maxPrice(listing.getMaxPrice())
        .listingType(listing.getListingType())
        .listingStatus(listing.getListingStatus())
        .name(productDocument.getName())
        .description(productDocument.getDescription())
        .thumbnailUrl(productDocument.getThumbnailUrl())
        .productMedias(productDocument.getProductMedias())
        .facilityId(productDocument.getFacilityId())
        .primaryCategoryId(productDocument.getPrimaryCategoryId())
        .categoryIds(productDocument.getCategoryIds())
        .subCategoryIds(productDocument.getSubCategoryIds())
        .primarySubCategoryId(productDocument.getPrimarySubCategoryId())
        .attributeIds(productDocument.getAttributeIds())
        .attributeValues(productDocument.getAttributeValues())
        .variantSkus(productDocument.getVariantSkus())
        .variants(toVariantDocuments(productDocument.getVariants()))
        .status(productDocument.getStatus())
        .productId(product.getId())
        .createdAt(productDocument.getCreatedAt())
        .updatedAt(productDocument.getUpdatedAt())
        .provinceCode(productDocument.getProvinceCode())
        .wardCode(productDocument.getWardCode())
        .location(productDocument.getLocation())
        .build();
  }

  private List<ListingDocument.VariantDocument> toVariantDocuments(
      List<ProductDocument.VariantDocument> variants) {
    if (variants == null || variants.isEmpty()) {
      return List.of();
    }
    return variants.stream()
        .map(variant -> ListingDocument.VariantDocument.builder()
            .sku(variant.getSku())
            .quantity(variant.getQuantity())
            .build())
        .toList();
  }
}
