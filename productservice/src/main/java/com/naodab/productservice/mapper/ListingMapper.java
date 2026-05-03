package com.naodab.productservice.mapper;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.ListingVariantResponse;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductVariant;

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
        .variants(toDocumentVariantSnapshots(productDocument.getVariants()))
        .status(productDocument.getStatus())
        .productId(product.getId())
        .createdAt(productDocument.getCreatedAt())
        .updatedAt(productDocument.getUpdatedAt())
        .provinceCode(productDocument.getProvinceCode())
        .wardCode(productDocument.getWardCode())
        .location(productDocument.getLocation())
        .build();
  }

  public ListingItemResponse toListingItemResponse(Listing listing) {
    if (listing == null) {
      return null;
    }
    Product product = listing.getProduct();

    String productId = product == null ? null : product.getId();
    String productName = product == null ? null : product.getName();
    String thumb = product == null ? null : productMapper.thumbnailImageUrl(product);

    return ListingItemResponse.builder()
        .id(listing.getId())
        .title(listing.getTitle())
        .description(listing.getDescription())
        .listingType(listing.getListingType())
        .listingStatus(listing.getListingStatus())
        .minPrice(listing.getMinPrice())
        .maxPrice(listing.getMaxPrice())
        .productId(productId)
        .productName(productName)
        .thumbnailImage(thumb)
        .build();
  }

  /** Map Elasticsearch listing document to the same DTO shape as facility listing rows. */
  public ListingItemResponse toListingItemResponse(ListingDocument doc) {
    if (doc == null) {
      return null;
    }
    return ListingItemResponse.builder()
        .id(doc.getId())
        .title(doc.getTitle())
        .description(doc.getListingDescription())
        .listingType(doc.getListingType())
        .listingStatus(doc.getListingStatus())
        .minPrice(doc.getMinPrice())
        .maxPrice(doc.getMaxPrice())
        .productId(doc.getProductId())
        .productName(doc.getName())
        .thumbnailImage(doc.getThumbnailUrl())
        .build();
  }

  public ListingResponse toListingResponse(Listing listing, List<ListingVariant> variants) {
    if (listing == null) {
      return null;
    }

    Product product = listing.getProduct();
    List<ListingVariantResponse> variantResponses =
        variants == null || variants.isEmpty() ? Collections.emptyList()
            : variants.stream().map(this::toListingVariantResponse).toList();

    return ListingResponse.builder()
        .id(listing.getId())
        .productId(product == null ? null : product.getId())
        .title(listing.getTitle())
        .description(listing.getDescription())
        .listingType(listing.getListingType())
        .listingStatus(listing.getListingStatus())
        .minPrice(listing.getMinPrice())
        .maxPrice(listing.getMaxPrice())
        .variants(variantResponses)
        .build();
  }

  private ListingVariantResponse toListingVariantResponse(ListingVariant variant) {
    ProductVariant pv = variant.getProductVariant();
    return ListingVariantResponse.builder()
        .id(variant.getId())
        .productVariantId(pv == null ? null : pv.getId())
        .buyPrice(variant.getBuyPrice())
        .rentPrice(variant.getRentPrice())
        .rentUnit(variant.getRentUnit())
        .isActive(variant.getIsActive())
        .build();
  }

  private List<ListingDocument.VariantDocument> toDocumentVariantSnapshots(
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
