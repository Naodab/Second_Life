package com.naodab.productservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Product;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ListingItemMapper {

  private final ProductMapper productMapper;

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
}
