package com.naodab.productservice.mapper;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.ListingVariantResponse;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.SubCategory;
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
        .facilityName(facilitySnapshotName(product))
        .facilityImageUrl(facilitySnapshotImageUrl(product))
        .facilityAddress(facilitySnapshotAddress(product))
        .averageRating(facilitySnapshotAverageRating(product))
        .primarySubCategoryName(primarySubCategorySnapshotName(product))
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

    Facility facility = product == null ? null : product.getFacility();
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
        .facilityId(facility == null ? null : facility.getId())
        .facilityName(facility == null ? null : facility.getName())
        .facilityImageUrl(facility == null ? null : facility.getImageUrl())
        .facilityAddress(facility == null ? null : facility.getAddress())
        .averageRating(facility == null || facility.getAverageRating() == null
            ? null
            : facility.getAverageRating().doubleValue())
        .primarySubCategoryName(primarySubCategorySnapshotName(product))
        .build();
  }

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
        .facilityId(doc.getFacilityId())
        .facilityName(doc.getFacilityName())
        .facilityImageUrl(doc.getFacilityImageUrl())
        .facilityAddress(doc.getFacilityAddress())
        .averageRating(doc.getAverageRating())
        .primarySubCategoryName(doc.getPrimarySubCategoryName())
        .build();
  }

  private static String facilitySnapshotName(Product product) {
    if (product == null || product.getFacility() == null) {
      return null;
    }
    return product.getFacility().getName();
  }

  private static String facilitySnapshotAddress(Product product) {
    if (product == null || product.getFacility() == null) {
      return null;
    }
    return product.getFacility().getAddress();
  }

  private static String primarySubCategorySnapshotName(Product product) {
    if (product == null || product.getPrimarySubCategory() == null) {
      return null;
    }
    SubCategory sub = product.getPrimarySubCategory();
    return sub.getName();
  }

  private static String facilitySnapshotImageUrl(Product product) {
    if (product == null || product.getFacility() == null) {
      return null;
    }
    return product.getFacility().getImageUrl();
  }

  private static Double facilitySnapshotAverageRating(Product product) {
    if (product == null || product.getFacility() == null || product.getFacility().getAverageRating() == null) {
      return null;
    }
    return product.getFacility().getAverageRating().doubleValue();
  }

  public ListingResponse toListingResponse(Listing listing, List<ListingVariant> variants) {
    if (listing == null) {
      return null;
    }

    Product product = listing.getProduct();
    List<ListingVariantResponse> variantResponses = variants == null || variants.isEmpty() ? Collections.emptyList()
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
